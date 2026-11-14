import { openExternalUrl } from '../utils/url';

export type LicensePlan = 'lifetime' | 'annual' | 'monthly' | 'trial';

export interface LicenseInfo {
  isLicensed: boolean;
  isExpired?: boolean;
  licenseKey: string | null;
  planType: LicensePlan | null;
  customerName: string | null;
  expiresAt: number | null;
  token: string | null;
  hardwareId: string;
  maxDevices?: number;
  lastVerifiedAt?: number;
}

const STORAGE_KEY_LICENSE = 'tg_drive_license_data';
const STORAGE_KEY_HWID = 'tg_drive_hwid';

// Default worker endpoint (or custom domain if configured)
const DEFAULT_LICENSE_API = 'https://tg-drive-license-service.baniarohan009.workers.dev';

export class LicenseManager {
  private static instance: LicenseManager;
  private currentLicense: LicenseInfo | null = null;
  private apiEndpoint: string = DEFAULT_LICENSE_API;
  private activePaymentPollTimer: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.apiEndpoint = (import.meta.env.VITE_LICENSE_API_URL as string) || DEFAULT_LICENSE_API;
  }

  public static getInstance(): LicenseManager {
    if (!LicenseManager.instance) {
      LicenseManager.instance = new LicenseManager();
    }
    return LicenseManager.instance;
  }

  public getCurrentLicense(): LicenseInfo | null {
    return this.currentLicense || this.getCachedLicense();
  }

  // Fast synchronous unique hardware ID
  public getHardwareIdSync(): string {
    if (typeof localStorage === 'undefined') return 'hw-default';
    let localHwid = localStorage.getItem(STORAGE_KEY_HWID);
    if (!localHwid) {
      localHwid = 'hw-' + (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36));
      try {
        localStorage.setItem(STORAGE_KEY_HWID, localHwid);
      } catch {}
    }
    return localHwid;
  }

  // Returns unique hardware ID for this PC/Phone
  public async getHardwareId(): Promise<string> {
    return this.getHardwareIdSync();
  }

  // Default empty license info
  public getDefaultLicenseInfo(): LicenseInfo {
    return {
      isLicensed: false,
      isExpired: false,
      licenseKey: null,
      planType: null,
      customerName: null,
      expiresAt: null,
      token: null,
      hardwareId: this.getHardwareIdSync(),
    };
  }

  // Synchronous, 0ms instant license retrieval from cache/localStorage
  public getCachedLicense(): LicenseInfo {
    if (this.currentLicense && this.currentLicense.isLicensed && (!this.currentLicense.expiresAt || this.currentLicense.expiresAt > Math.floor(Date.now() / 1000))) {
      return this.currentLicense;
    }
    if (typeof localStorage === 'undefined') {
      return this.getDefaultLicenseInfo();
    }
    const stored = localStorage.getItem(STORAGE_KEY_LICENSE);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LicenseInfo;
        if (parsed && parsed.isLicensed && (parsed.token || parsed.licenseKey)) {
          // If monthly or annual, ensure expiresAt is calculated if missing
          if (!parsed.expiresAt && (parsed.planType === 'monthly' || parsed.planType === 'annual')) {
            const durationSec = parsed.planType === 'annual' ? 365 * 86400 : 30 * 86400;
            parsed.expiresAt = (parsed.lastVerifiedAt || Math.floor(Date.now() / 1000)) + durationSec;
          }
          if (parsed.expiresAt && parsed.expiresAt < Math.floor(Date.now() / 1000)) {
            parsed.isLicensed = false;
            parsed.isExpired = true;
          } else {
            parsed.isExpired = false;
          }
          parsed.hardwareId = this.getHardwareIdSync();
          this.currentLicense = parsed;
          return parsed;
        }
      } catch {
        // ignore parse error
      }
    }
    return this.getDefaultLicenseInfo();
  }

  // Loads cached license information from local storage (instantaneous)
  public async loadLicense(): Promise<LicenseInfo> {
    const cached = this.getCachedLicense();
    if (cached.isLicensed) {
      this.notifyLicenseUpdated(cached);
    }
    return cached;
  }

  public notifyLicenseUpdated(info: LicenseInfo): void {
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('tg_drive_license_updated', { detail: info }));
      } catch {}
    }
  }

  public detectPlatform(): string {
    if (typeof navigator === 'undefined') return 'windows';
    const ua = navigator.userAgent.toLowerCase();
    if (/android/i.test(ua)) return 'android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    if (/macintosh|mac os x/i.test(ua)) return 'macos';
    if (/linux/i.test(ua)) return 'linux';
    return 'windows';
  }

  public detectDeviceName(): string {
    const plat = this.detectPlatform();
    if (plat === 'android') return 'Android Phone';
    if (plat === 'ios') return 'iPhone';
    if (plat === 'macos') return 'Mac';
    if (plat === 'linux') return 'Linux PC';
    return 'Windows PC';
  }

  // Activates the software using a License Key
  public async activateLicense(
    licenseKey: string,
    deviceName?: string,
    platform?: string,
    telegramUserId?: string | number | null,
    phone?: string | null
  ): Promise<{ success: boolean; message?: string; license?: LicenseInfo }> {
    const hwid = await this.getHardwareId();
    const cleanKey = licenseKey.trim().toUpperCase();
    const resolvedPlatform = platform || this.detectPlatform();
    const resolvedDeviceName = deviceName || this.detectDeviceName();

    try {
      const response = await fetch(`${this.apiEndpoint}/api/license/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_key: cleanKey,
          hardware_id: hwid,
          device_name: resolvedDeviceName,
          platform: resolvedPlatform,
          telegram_user_id: telegramUserId ? String(telegramUserId).trim() : undefined,
          phone_number: phone ? String(phone).trim() : undefined,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        token?: string;
        plan_type?: LicensePlan;
        expires_at?: number | null;
        customer_name?: string | null;
        max_devices?: number;
      };

      if (!response.ok || !data.success) {
        return {
          success: false,
          message: data.error || 'Failed to activate license. Please verify your key.',
        };
      }

      const licenseInfo: LicenseInfo = {
        isLicensed: true,
        licenseKey: cleanKey,
        planType: data.plan_type || 'lifetime',
        customerName: data.customer_name || null,
        expiresAt: data.expires_at || null,
        token: data.token || null,
        hardwareId: hwid,
        maxDevices: data.max_devices || 2,
        lastVerifiedAt: Math.floor(Date.now() / 1000),
      };

      localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(licenseInfo));
      this.currentLicense = licenseInfo;
      this.notifyLicenseUpdated(licenseInfo);

      return {
        success: true,
        license: licenseInfo,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Network error connecting to license server.',
      };
    }
  }

  // Claims a free trial for this device
  public async claimFreeTrial(
    name: string,
    email: string
  ): Promise<{ success: boolean; message?: string; license?: LicenseInfo }> {
    const hwid = await this.getHardwareId();
    try {
      const response = await fetch(`${this.apiEndpoint}/api/store/claim-trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          hardware_id: hwid,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
        license_key?: string;
        customer_name?: string;
        expires_at?: number;
        token?: string;
        message?: string;
      };

      if (!response.ok || !data.success || !data.license_key) {
        return {
          success: false,
          message: data.error || 'Unable to claim free trial. Please check details.',
        };
      }

      const licenseInfo: LicenseInfo = {
        isLicensed: true,
        licenseKey: data.license_key,
        planType: 'trial',
        customerName: data.customer_name || name.trim(),
        expiresAt: data.expires_at || null,
        token: data.token || null,
        hardwareId: hwid,
        maxDevices: 2,
        lastVerifiedAt: Math.floor(Date.now() / 1000),
      };

      localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(licenseInfo));
      this.currentLicense = licenseInfo;
      this.notifyLicenseUpdated(licenseInfo);

      return {
        success: true,
        message: data.message,
        license: licenseInfo,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Error connecting to trial server.',
      };
    }
  }

  // Verifies entitlement by Telegram User ID / Phone Number (Zero-Key seamless flow)
  public async checkTelegramAccount(
    telegramUserId?: string | number | null,
    phone?: string | null
  ): Promise<{ success: boolean; isLicensed: boolean; isExpired?: boolean; message?: string; license?: LicenseInfo }> {
    const hwid = this.getHardwareIdSync();
    const tgId = telegramUserId ? String(telegramUserId).trim() : '';
    const tgPhone = phone ? String(phone).trim() : '';

    if (!tgId && !tgPhone) {
      return { success: false, isLicensed: false, message: 'No Telegram account info provided' };
    }

    // If we already have a valid unexpired local license for this user that was checked recently, return it instantly
    const cached = this.getCachedLicense();
    if (cached.isLicensed && cached.licenseKey && tgId && cached.licenseKey.includes(tgId)) {
      if (cached.lastVerifiedAt && (Math.floor(Date.now() / 1000) - cached.lastVerifiedAt < 300)) {
        return { success: true, isLicensed: true, license: cached };
      }
    }

    const endpoints = [
      `${this.apiEndpoint}/api/license/check-account`,
      'https://tg-drive-license-service.jupiterbania472.workers.dev/api/license/check-account'
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            telegram_user_id: tgId,
            phone_number: tgPhone,
          }),
        });
        clearTimeout(timeoutId);

        if (!response.ok) continue;

        const data = (await response.json()) as {
          active?: boolean;
          license_key?: string;
          plan_type?: LicensePlan;
          customer_name?: string;
          customer_email?: string;
          expires_at?: number | null;
          token?: string;
          message?: string;
          is_expired?: boolean;
          expired?: boolean;
        };

        if (data.active) {
          const resolvedPlan: LicensePlan = data.plan_type
            ? data.plan_type
            : data.expires_at
            ? (data.expires_at - Math.floor(Date.now() / 1000) > 35 * 86400 ? 'annual' : 'monthly')
            : 'monthly';

          const licenseInfo: LicenseInfo = {
            isLicensed: true,
            isExpired: false,
            licenseKey: data.license_key || `TG-PRO-${tgId}`,
            planType: resolvedPlan,
            customerName: data.customer_name || null,
            expiresAt: resolvedPlan === 'lifetime' ? null : (data.expires_at || (Math.floor(Date.now() / 1000) + 30 * 86400)),
            token: data.token || null,
            hardwareId: hwid,
            maxDevices: 999, // Unlocked across all user devices
            lastVerifiedAt: Math.floor(Date.now() / 1000),
          };

          localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(licenseInfo));
          this.currentLicense = licenseInfo;
          this.notifyLicenseUpdated(licenseInfo);

          return {
            success: true,
            isLicensed: true,
            license: licenseInfo,
          };
        }

        if (data.is_expired || (data as unknown as { expired?: boolean }).expired) {
          const licenseInfo: LicenseInfo = {
            isLicensed: false,
            isExpired: true,
            licenseKey: data.license_key || `TG-PRO-${tgId}`,
            planType: data.plan_type || null,
            customerName: data.customer_name || null,
            expiresAt: data.expires_at || null,
            token: null,
            hardwareId: hwid,
            maxDevices: 999,
            lastVerifiedAt: Math.floor(Date.now() / 1000),
          };
          localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(licenseInfo));
          this.currentLicense = licenseInfo;
          this.notifyLicenseUpdated(licenseInfo);
          return {
            success: true,
            isLicensed: false,
            isExpired: true,
            license: licenseInfo,
            message: 'Your Pro subscription has expired.',
          };
        }

        return {
          success: true,
          isLicensed: false,
          message: data.message || 'No active pro entitlement found for this Telegram account.',
        };
      } catch {
        // Try fallback endpoint
      }
    }

    // If server unreachable, keep existing active cached license without wiping
    if (cached.isLicensed) {
      return { success: true, isLicensed: true, license: cached };
    }

    return {
      success: false,
      isLicensed: false,
      message: 'License server unreachable; offline mode active.',
    };
  }

  // Dynamically load Razorpay Checkout JS SDK if not present
  public async loadRazorpaySdk(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if ((window as unknown as { Razorpay?: unknown }).Razorpay) return true;

    return new Promise(resolve => {
      const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
      if (existing) {
        let attempts = 0;
        const check = setInterval(() => {
          attempts++;
          if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
            clearInterval(check);
            resolve(true);
          } else if (attempts > 30) {
            clearInterval(check);
            resolve(false);
          }
        }, 100);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        let attempts = 0;
        const check = setInterval(() => {
          attempts++;
          if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
            clearInterval(check);
            resolve(true);
          } else if (attempts > 20) {
            clearInterval(check);
            resolve(Boolean((window as unknown as { Razorpay?: unknown }).Razorpay));
          }
        }, 50);
      };
      script.onerror = () => {
        console.warn('Failed to load Razorpay checkout script from CDN');
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  // Creates Razorpay Order on supporter-service backend
  public async createRazorpayOrder(data: {
    telegramUserId: string | number;
    planType?: LicensePlan;
    amount?: number;
    customerName?: string;
    customerEmail?: string;
    phoneNumber?: string;
    checkoutConfigId?: string;
    referralCode?: string;
    username?: string;
  }): Promise<{
    success: boolean;
    orderId?: string;
    keyId?: string;
    amount?: number;
    currency?: string;
    checkoutConfigId?: string;
    paymentLinkUrl?: string;
    error?: string;
  }> {
    try {
      const res = await fetch(`${this.apiEndpoint}/api/payment/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_user_id: String(data.telegramUserId),
          plan_type: data.planType || 'lifetime',
          amount: data.amount,
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          phone_number: data.phoneNumber,
          referral_code: data.referralCode,
          username: data.username,
        }),
      });

      const body = (await res.json()) as {
        success?: boolean;
        order_id?: string;
        key_id?: string;
        amount?: number;
        currency?: string;
        payment_link_url?: string;
        error?: string;
      };

      if (!res.ok || !body.success || !body.order_id) {
        return { success: false, error: body.error || 'Failed to create payment order' };
      }

      return {
        success: true,
        orderId: body.order_id,
        keyId: body.key_id,
        amount: body.amount,
        currency: body.currency,
        paymentLinkUrl: body.payment_link_url,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Network error creating order' };
    }
  }

  // Verifies Razorpay payment signature & unlocks Pro entitlement
  public async verifyRazorpayPayment(data: {
    orderId: string;
    paymentId: string;
    signature: string;
    telegramUserId: string | number;
    planType?: LicensePlan;
    customerName?: string;
    customerEmail?: string;
    phoneNumber?: string;
    referralCode?: string;
    username?: string;
  }): Promise<{ success: boolean; isPro: boolean; license?: LicenseInfo; error?: string }> {
    const hwid = await this.getHardwareId();
    const tgId = String(data.telegramUserId).trim();

    try {
      const res = await fetch(`${this.apiEndpoint}/api/payment/razorpay/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: data.orderId,
          payment_id: data.paymentId,
          signature: data.signature,
          telegram_user_id: tgId,
          plan_type: data.planType || 'lifetime',
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          phone_number: data.phoneNumber,
          referral_code: data.referralCode,
          username: data.username,
        }),
      });

      const body = (await res.json()) as {
        success?: boolean;
        is_pro?: boolean;
        plan_type?: LicensePlan;
        token?: string;
        expires_at?: number | null;
        error?: string;
        message?: string;
      };

      if (!res.ok || !body.success) {
        return { success: false, isPro: false, error: body.error || 'Payment verification failed' };
      }

      const licenseInfo: LicenseInfo = {
        isLicensed: true,
        licenseKey: `TG-PRO-${tgId}`,
        planType: body.plan_type || data.planType || 'lifetime',
        customerName: data.customerName || null,
        expiresAt: body.expires_at || null,
        token: body.token || null,
        hardwareId: hwid,
        maxDevices: 999,
        lastVerifiedAt: Math.floor(Date.now() / 1000),
      };

      localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(licenseInfo));
      this.currentLicense = licenseInfo;
      this.notifyLicenseUpdated(licenseInfo);

      return { success: true, isPro: true, license: licenseInfo };
    } catch (err) {
      return { success: false, isPro: false, error: err instanceof Error ? err.message : 'Network error verifying payment' };
    }
  }

  // Verifies whether this Telegram account has active Pro entitlement directly from backend DB
  public async checkUserAccountProStatus(telegramUserId: string | number): Promise<{ active: boolean; isPro: boolean; license?: LicenseInfo }> {
    const hwid = this.getHardwareIdSync();
    const tgId = String(telegramUserId).trim();
    if (!tgId) return { active: false, isPro: false };

    // If cached license is already valid, return it immediately
    const cached = this.getCachedLicense();
    if (cached.isLicensed && cached.licenseKey && cached.licenseKey.includes(tgId)) {
      if (cached.lastVerifiedAt && (Math.floor(Date.now() / 1000) - cached.lastVerifiedAt < 300)) {
        return { active: true, isPro: true, license: cached };
      }
    }

    const endpoints = [
      `${this.apiEndpoint}/api/user/status?telegram_user_id=${encodeURIComponent(tgId)}&_t=${Date.now()}`,
      `https://tg-drive-license-service.jupiterbania472.workers.dev/api/user/status?telegram_user_id=${encodeURIComponent(tgId)}&_t=${Date.now()}`
    ];

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) continue;

        const data = (await res.json()) as {
          active?: boolean;
          is_pro?: boolean;
          is_expired?: boolean;
          plan_type?: LicensePlan;
          token?: string;
          expires_at?: number | null;
          first_name?: string;
        };

        if (data.is_pro || data.active) {
          const resolvedPlan: LicensePlan = data.plan_type
            ? data.plan_type
            : data.expires_at
            ? (data.expires_at - Math.floor(Date.now() / 1000) > 35 * 86400 ? 'annual' : 'monthly')
            : 'monthly';

          const licenseInfo: LicenseInfo = {
            isLicensed: true,
            isExpired: false,
            licenseKey: `TG-PRO-${tgId}`,
            planType: resolvedPlan,
            customerName: data.first_name || null,
            expiresAt: resolvedPlan === 'lifetime' ? null : (data.expires_at || (Math.floor(Date.now() / 1000) + 30 * 86400)),
            token: data.token || null,
            hardwareId: hwid,
            maxDevices: 999,
            lastVerifiedAt: Math.floor(Date.now() / 1000),
          };

          localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(licenseInfo));
          this.currentLicense = licenseInfo;
          this.notifyLicenseUpdated(licenseInfo);
          return { active: true, isPro: true, license: licenseInfo };
        } else if (data.is_expired) {
          const licenseInfo: LicenseInfo = {
            isLicensed: false,
            isExpired: true,
            licenseKey: `TG-PRO-${tgId}`,
            planType: data.plan_type || null,
            customerName: data.first_name || null,
            expiresAt: data.expires_at || null,
            token: null,
            hardwareId: hwid,
            maxDevices: 999,
            lastVerifiedAt: Math.floor(Date.now() / 1000),
          };

          localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(licenseInfo));
          this.currentLicense = licenseInfo;
          this.notifyLicenseUpdated(licenseInfo);
          return { active: false, isPro: false, license: licenseInfo };
        }
      } catch (err) {
        // Try fallback endpoint
      }
    }

    if (cached.isLicensed) {
      return { active: true, isPro: true, license: cached };
    }

    return { active: false, isPro: false };
  }

  public stopPaymentPolling(): void {
    if (this.activePaymentPollTimer) {
      clearInterval(this.activePaymentPollTimer);
      this.activePaymentPollTimer = null;
    }
  }

  // Starts full seamless Razorpay Checkout Flow (UPI / GPay / PhonePe / Cards / Netbanking)
  public async startRazorpayCheckout(params: {
    telegramUserId: string | number;
    planType?: LicensePlan;
    amount?: number;
    planName?: string;
    customerName?: string;
    customerEmail?: string;
    phoneNumber?: string;
    referralCode?: string;
    username?: string;
    onOpen?: () => void;
    onSuccess?: (license: LicenseInfo) => void;
    onError?: (error: string) => void;
    onDismiss?: () => void;
  }): Promise<void> {
    const sdkLoaded = await this.loadRazorpaySdk();
    const orderRes = await this.createRazorpayOrder({
      telegramUserId: params.telegramUserId,
      planType: params.planType || 'lifetime',
      amount: params.amount,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      phoneNumber: params.phoneNumber,
      referralCode: params.referralCode,
      username: params.username,
    });

    if (!orderRes.success || !orderRes.orderId) {
      params.onError?.(orderRes.error || 'Could not initiate payment order');
      return;
    }

    const RazorpayCtor = (window as unknown as {
      Razorpay?: new (opts: unknown) => {
        open: () => void;
        on?: (event: string, cb: (data: unknown) => void) => void;
      };
    }).Razorpay;

    // Use In-App Razorpay Checkout Modal (works seamlessly across mobile & desktop)
    if (sdkLoaded && RazorpayCtor) {
      let paymentCompleted = false;
      let paymentVerified = false;

      const options = {
        key: orderRes.keyId || 'rzp_live_T1mw2QboxNW91L',
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'TG Drive Pro',
        description: `${params.planName || 'Pro'} Upgrade`,
        image: 'https://tg-drive.vercel.app/logo.png',
        order_id: orderRes.orderId,
        prefill: {
          name: params.customerName || 'TG Drive User',
          email: params.customerEmail || `tg_${params.telegramUserId}@t-drive.internal`,
          contact: params.phoneNumber || '',
        },
        theme: {
          color: '#8b5cf6',
          backdrop_color: '#090b10',
        },
        notes: {
          telegram_user_id: String(params.telegramUserId),
          plan_type: params.planType || 'lifetime',
          referral_code: params.referralCode || '',
          username: params.username || '',
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          paymentCompleted = true;
          // Verify payment cryptographically on backend with HMAC-SHA256 signature
          const verifyRes = await this.verifyRazorpayPayment({
            orderId: response.razorpay_order_id || orderRes.orderId!,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            telegramUserId: params.telegramUserId,
            planType: params.planType || 'lifetime',
            customerName: params.customerName,
            customerEmail: params.customerEmail,
            phoneNumber: params.phoneNumber,
            referralCode: params.referralCode,
            username: params.username,
          });

          if (verifyRes.success && verifyRes.license && verifyRes.isPro) {
            paymentVerified = true;
            params.onSuccess?.(verifyRes.license);
          } else {
            params.onError?.(verifyRes.error || 'Payment verification failed with server.');
          }
        },
        modal: {
          confirm_close: true,
          ondismiss: () => {
            if (!paymentCompleted && !paymentVerified) {
              if (params.onDismiss) {
                params.onDismiss();
              } else {
                params.onError?.('Payment cancelled');
              }
            }
          },
        },
      };

      const rzpInstance = new RazorpayCtor(options);

      if (typeof rzpInstance.on === 'function') {
        rzpInstance.on('payment.failed', (response: unknown) => {
          const errObj = response as { error?: { description?: string } };
          const errMsg = errObj?.error?.description || 'Payment failed or was declined.';
          params.onError?.(errMsg);
        });
      }

      rzpInstance.open();
      params.onOpen?.();
    } else {
      // Emergency fallback if Razorpay in-app SDK is unavailable
      const fallbackPaymentUrl = orderRes.paymentLinkUrl || 'https://rzp.io/rzp/eBLEV0w';
      params.onOpen?.();
      await openExternalUrl(fallbackPaymentUrl);

      // Poll ONLY for verified confirmation of THIS order from Razorpay API
      this.stopPaymentPolling();
      const startTime = Date.now();
      this.activePaymentPollTimer = setInterval(async () => {
        if (Date.now() - startTime > 300000) {
          this.stopPaymentPolling();
          return;
        }

        try {
          const verifyRes = await fetch(`${this.apiEndpoint}/api/payment/razorpay/verify-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              order_id: orderRes.orderId,
              telegram_user_id: String(params.telegramUserId),
              plan_type: params.planType || 'lifetime',
            }),
          });
          if (verifyRes.ok) {
            const data = (await verifyRes.json()) as { paid?: boolean; success?: boolean; is_pro?: boolean };
            if (data.paid && data.success && data.is_pro) {
              this.stopPaymentPolling();
              const refreshed = await this.checkUserAccountProStatus(params.telegramUserId);
              if (refreshed.active && refreshed.license) {
                params.onSuccess?.(refreshed.license);
              }
            }
          }
        } catch {
          // Continue polling until timeout
        }
      }, 3000);
    }
  }

  // Public polling helper for orders initiated outside the in-app modal (e.g. browser link)
  public pollOrderCompletion(orderId?: string, telegramUserId?: string | number, onSuccess?: (license: LicenseInfo) => void): void {
    const tgId = telegramUserId ? String(telegramUserId).trim() : '';
    if (!orderId || !tgId) return;
    this.stopPaymentPolling();
    const startTime = Date.now();
    this.activePaymentPollTimer = setInterval(async () => {
      if (Date.now() - startTime > 300000) {
        this.stopPaymentPolling();
        return;
      }
      try {
        const verifyRes = await fetch(`${this.apiEndpoint}/api/payment/razorpay/verify-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            telegram_user_id: tgId,
          }),
        });
        if (verifyRes.ok) {
          const data = (await verifyRes.json()) as { paid?: boolean; success?: boolean; is_pro?: boolean };
          if (data.paid && data.success && data.is_pro) {
            this.stopPaymentPolling();
            const refreshed = await this.checkUserAccountProStatus(tgId);
            if (refreshed.active && refreshed.license) {
              onSuccess?.(refreshed.license);
            }
          }
        }
      } catch {}
    }, 2500);
  }

  // Polls order status for real-time automatic license unlocking after checkout
  public async pollOrderStatus(
    orderIdOrSession: string,
    email?: string,
    telegramUserId?: string | number | null,
    phone?: string | null
  ): Promise<{ paid: boolean; license?: LicenseInfo }> {
    const hwid = await this.getHardwareId();
    try {
      const response = await fetch(`${this.apiEndpoint}/api/store/order-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderIdOrSession,
          session_id: orderIdOrSession,
          email: email ? email.trim().toLowerCase() : undefined,
          telegram_user_id: telegramUserId ? String(telegramUserId).trim() : undefined,
          phone_number: phone ? String(phone).trim() : undefined,
        }),
      });

      if (!response.ok) return { paid: false };
      const data = (await response.json()) as {
        paid?: boolean;
        license_key?: string;
        plan_type?: LicensePlan;
        customer_name?: string | null;
        customer_email?: string | null;
        expires_at?: number | null;
        token?: string;
      };

      if (data.paid && data.license_key) {
        const licenseInfo: LicenseInfo = {
          isLicensed: true,
          licenseKey: data.license_key,
          planType: data.plan_type || 'lifetime',
          customerName: data.customer_name || null,
          expiresAt: data.expires_at || null,
          token: data.token || null,
          hardwareId: hwid,
          maxDevices: 2,
          lastVerifiedAt: Math.floor(Date.now() / 1000),
        };

        localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(licenseInfo));
        this.currentLicense = licenseInfo;
        this.notifyLicenseUpdated(licenseInfo);

        return {
          paid: true,
          license: licenseInfo,
        };
      }

      return { paid: false };
    } catch {
      return { paid: false };
    }
  }

  // Validates current license with server in background
  public async verifyLicense(): Promise<boolean> {
    const current = this.getCachedLicense();
    if (!current.isLicensed || !current.licenseKey) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const tgId = current.licenseKey.replace(/^TG[-_]?PRO[-_]?/i, '').trim();

      const response = await fetch(`${this.apiEndpoint}/api/license/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          license_key: current.licenseKey,
          hardware_id: current.hardwareId,
          token: current.token,
          telegram_user_id: tgId || undefined,
        }),
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = (await response.json()) as {
          valid: boolean;
          reason?: string;
          plan_type?: LicensePlan;
          expires_at?: number | null;
          customer_name?: string | null;
        };

        if (!data.valid) {
          // CRITICAL: Only revoke if explicitly banned or expired
          if (data.reason === 'License banned' || data.reason === 'License expired') {
            current.isLicensed = false;
            current.isExpired = data.reason === 'License expired';
            localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(current));
            this.notifyLicenseUpdated(current);
            return false;
          }
          // If reason is "License not found", do NOT destroy local active license!
          return current.isLicensed;
        }

        if (data.plan_type) current.planType = data.plan_type;
        if (data.expires_at !== undefined) current.expiresAt = data.expires_at;
        if (data.customer_name) current.customerName = data.customer_name;
        current.isExpired = false;
        current.lastVerifiedAt = Math.floor(Date.now() / 1000);

        localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(current));
        this.notifyLicenseUpdated(current);
        return true;
      }
      // If server unreachable, allow graceful offline access
      return current.isLicensed;
    } catch {
      // Offline mode: Keep app unlocked if token was valid
      return current.isLicensed;
    }
  }

  // Deactivates this device so key can be moved to another machine
  public async deactivateLicense(): Promise<boolean> {
    const current = await this.loadLicense();
    if (!current.licenseKey) return true;

    try {
      await fetch(`${this.apiEndpoint}/api/license/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_key: current.licenseKey,
          hardware_id: current.hardwareId,
        }),
      });
    } catch {
      // Ignore network errors on deactivation
    }

    localStorage.removeItem(STORAGE_KEY_LICENSE);
    this.currentLicense = null;
    return true;
  }

  // Calculates human-readable time remaining and formatted expiration date
  public getExpiryDetails(expiresAt: number | null, planType?: LicensePlan | null): {
    isLifetime: boolean;
    isExpired: boolean;
    formattedDate: string;
    formattedTime: string;
    formattedFull: string;
    remainingDays: number;
    remainingHours: number;
    remainingMinutes: number;
    countdownText: string;
    status: 'lifetime' | 'active' | 'expiring_soon' | 'expired';
  } {
    const isNonLifetime = planType === 'monthly' || planType === 'annual' || planType === 'trial';

    if (planType === 'lifetime' || (!isNonLifetime && !expiresAt)) {
      return {
        isLifetime: true,
        isExpired: false,
        formattedDate: 'Permanent VIP Access',
        formattedTime: 'Never Expires',
        formattedFull: 'Lifetime VIP Access • Never Expires',
        remainingDays: 99999,
        remainingHours: 99999,
        remainingMinutes: 99999,
        countdownText: 'Lifetime Access',
        status: 'lifetime',
      };
    }

    const effectiveExpiresAt = expiresAt || (Math.floor(Date.now() / 1000) + (planType === 'annual' ? 365 * 86400 : 30 * 86400));
    const now = Math.floor(Date.now() / 1000);
    const diff = effectiveExpiresAt - now;

    const date = new Date(effectiveExpiresAt * 1000);
    const formattedDate = date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const formattedFull = `${formattedDate}, ${formattedTime}`;

    if (diff <= 0) {
      const absDiff = Math.abs(diff);
      const expiredDays = Math.floor(absDiff / 86400);
      const countdownText = expiredDays > 0 ? `Expired ${expiredDays}d ago` : 'Expired today';
      return {
        isLifetime: false,
        isExpired: true,
        formattedDate,
        formattedTime,
        formattedFull,
        remainingDays: 0,
        remainingHours: 0,
        remainingMinutes: 0,
        countdownText,
        status: 'expired',
      };
    }

    const days = Math.floor(diff / 86400);
    const hours = Math.floor((diff % 86400) / 3600);
    const minutes = Math.floor((diff % 3600) / 60);

    let countdownText = `${days}d left`;
    if (days === 0) {
      countdownText = hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`;
    }

    return {
      isLifetime: false,
      isExpired: false,
      formattedDate,
      formattedTime,
      formattedFull,
      remainingDays: days,
      remainingHours: hours,
      remainingMinutes: minutes,
      countdownText,
      status: days <= 3 ? 'expiring_soon' : 'active',
    };
  }

  public async getStoreConfig(): Promise<StoreConfig | null> {
    try {
      const cacheBust = `_t=${Date.now()}`;
      const res = await fetch(`${this.apiEndpoint}/api/store/config?${cacheBust}`, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as StoreConfig;
        return data;
      }
    } catch (e) {
      console.warn('[licenseManager] Failed to fetch live store config:', e);
    }
    return null;
  }

  public async getActiveOffer(): Promise<{ active: boolean; offer: ActiveSpecialOffer | null }> {
    try {
      const cacheBust = `_t=${Date.now()}`;
      const res = await fetch(`${this.apiEndpoint}/api/store/active-offer?${cacheBust}`, { cache: 'no-store' });
      if (res.ok) {
        const data = (await res.json()) as { active: boolean; offer: ActiveSpecialOffer | null };
        return data;
      }
    } catch (e) {
      console.warn('[licenseManager] Failed to fetch active offer:', e);
    }
    return { active: false, offer: null };
  }
}

export interface ActiveSpecialOffer {
  id?: string;
  title: string;
  badge?: string;
  description: string;
  discount_type?: 'percent' | 'flat' | 'fixed' | 'bundle';
  discount_value?: number;
  original_price?: number;
  offer_price?: number;
  coupon_code?: string;
  remaining_seconds?: number | null;
  countdown_end?: number | null;
  perks_list?: string[];
  cta_text?: string;
  banner_style?: string;
}

export interface StorePlan {
  id: string;
  name: string;
  badge?: string;
  price: number;
  formatted_price?: string;
  originalPrice?: number;
  original_price?: number;
  formatted_original_price?: string;
  discountPercent?: number;
  discount_percent?: number;
  period?: string;
  periodLabel?: string;
  duration_days?: number;
  description: string;
  buy_url?: string;
  features: string[];
}

export interface StoreConfig {
  product_name: string;
  price: number;
  formatted_price: string;
  currency: string;
  buy_url: string;
  trial_enabled: boolean;
  trial_days: number;
  trial_label: string;
  plans: StorePlan[];
}

export const licenseManager = LicenseManager.getInstance();

