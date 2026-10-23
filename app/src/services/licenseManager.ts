import { invoke } from '@tauri-apps/api/core';
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
    return this.currentLicense;
  }

  // Returns unique hardware ID for this PC/Phone
  public async getHardwareId(): Promise<string> {
    try {
      // Try to get hardware ID from Rust backend
      const rustHwid = await invoke<string>('cmd_get_hardware_id');
      if (rustHwid && rustHwid.length > 5) {
        return rustHwid;
      }
    } catch {
      // Fallback for web / dev / standard environment
    }

    let localHwid = localStorage.getItem(STORAGE_KEY_HWID);
    if (!localHwid) {
      // Generate cryptographic random UUID for device
      localHwid = 'hw-' + crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY_HWID, localHwid);
    }
    return localHwid;
  }

  // Loads cached license information from local storage
  public async loadLicense(): Promise<LicenseInfo> {
    const hwid = await this.getHardwareId();
    const stored = localStorage.getItem(STORAGE_KEY_LICENSE);

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as LicenseInfo;
        // Verify license is active with either token or valid licenseKey
        if (parsed.isLicensed && (parsed.token || parsed.licenseKey)) {
          // If monthly or annual, ensure expiresAt is calculated if missing
          if (!parsed.expiresAt && (parsed.planType === 'monthly' || parsed.planType === 'annual')) {
            const durationSec = parsed.planType === 'annual' ? 365 * 86400 : 30 * 86400;
            parsed.expiresAt = (parsed.lastVerifiedAt || Math.floor(Date.now() / 1000)) + durationSec;
          }
          // Check expiration if time-limited
          if (parsed.expiresAt && parsed.expiresAt < Math.floor(Date.now() / 1000)) {
            parsed.isLicensed = false;
            parsed.isExpired = true;
            localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(parsed));
          } else {
            parsed.hardwareId = hwid;
            parsed.isExpired = false;
          }
          this.currentLicense = parsed;
          if (parsed.isLicensed) {
            this.notifyLicenseUpdated(parsed);
          }
          return parsed;
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY_LICENSE);
      }
    }

    const defaultInfo: LicenseInfo = {
      isLicensed: false,
      licenseKey: null,
      planType: null,
      customerName: null,
      expiresAt: null,
      token: null,
      hardwareId: hwid,
    };
    this.currentLicense = defaultInfo;
    return defaultInfo;
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
    const hwid = await this.getHardwareId();
    const tgId = telegramUserId ? String(telegramUserId).trim() : '';
    const tgPhone = phone ? String(phone).trim() : '';

    if (!tgId && !tgPhone) {
      return { success: false, isLicensed: false, message: 'No Telegram account info provided' };
    }

    try {
      const response = await fetch(`${this.apiEndpoint}/api/license/check-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_user_id: tgId,
          phone_number: tgPhone,
        }),
      });

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

        if (response.ok && data.active) {
        const licenseInfo: LicenseInfo = {
          isLicensed: true,
          isExpired: false,
          licenseKey: data.license_key || `TG-PRO-${tgId}`,
          planType: data.plan_type || 'lifetime',
          customerName: data.customer_name || null,
          expiresAt: data.expires_at || null,
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
    } catch (err) {
      return {
        success: false,
        isLicensed: false,
        message: err instanceof Error ? err.message : 'Error connecting to license server.',
      };
    }
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
          checkout_config_id: data.checkoutConfigId || 'config_TiUSpvBT1EEuwz',
        }),
      });

      const body = (await res.json()) as {
        success?: boolean;
        order_id?: string;
        key_id?: string;
        amount?: number;
        currency?: string;
        checkout_config_id?: string;
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
        checkoutConfigId: body.checkout_config_id || 'config_TiUSpvBT1EEuwz',
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
    const hwid = await this.getHardwareId();
    const tgId = String(telegramUserId).trim();
    if (!tgId) return { active: false, isPro: false };

    try {
      const res = await fetch(`${this.apiEndpoint}/api/user/status?telegram_user_id=${encodeURIComponent(tgId)}&_t=${Date.now()}`);
      if (res.ok) {
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
          const licenseInfo: LicenseInfo = {
            isLicensed: true,
            isExpired: false,
            licenseKey: `TG-PRO-${tgId}`,
            planType: data.plan_type || 'lifetime',
            customerName: data.first_name || null,
            expiresAt: data.expires_at || null,
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
      }
    } catch (err) {
      console.warn('[licenseManager] checkUserAccountProStatus network error:', err);
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
    });

    if (!orderRes.success || !orderRes.orderId) {
      params.onError?.(orderRes.error || 'Could not initiate payment order');
      return;
    }

    // Detect if running on mobile device or Android/iOS
    const plat = this.detectPlatform();
    const isMobileDevice = plat === 'android' || plat === 'ios' || (typeof window !== 'undefined' && window.innerWidth <= 768);

    // If on a mobile device (Android / Phone), ALWAYS open the Razorpay checkout in the phone's
    // external browser (Google Chrome). Inside Chrome, Google Pay, PhonePe, Paytm, and all UPI intent apps
    // are 100% active and unblocked (unlike the restricted in-app Android WebView).
    if (isMobileDevice) {
      let mobilePaymentUrl = orderRes.paymentLinkUrl;

      // If backend didn't return payment_link_url, create the Razorpay Payment Link directly
      if (!mobilePaymentUrl) {
        try {
          const keyId = orderRes.keyId || 'rzp_live_T1mw2QboxNW91L';
          const keySecret = 'reDkBo457g05IR6k2SwYeVkD';
          const auth = btoa(`${keyId}:${keySecret}`);
          const rawPhone = (params.phoneNumber || '').replace(/[^0-9+]/g, '');
          const customerContact = rawPhone.length >= 10 ? rawPhone : undefined;
          const customerEmail = params.customerEmail || `tg_${params.telegramUserId}@t-drive.internal`;

          const plRes = await fetch('https://api.razorpay.com/v1/payment_links', {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + auth,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: orderRes.amount,
              currency: 'INR',
              accept_partial: false,
              description: `TG Drive Pro (${params.planName || 'Lifetime'}) Upgrade`,
              customer: {
                name: params.customerName || 'TG Drive User',
                contact: customerContact,
                email: customerEmail,
              },
              notify: { sms: false, email: false },
              reminder_enable: false,
              notes: {
                telegram_user_id: String(params.telegramUserId),
                order_id: orderRes.orderId,
                plan_type: params.planType || 'lifetime',
              },
              callback_url: `https://tg-drive-license-service.baniarohan009.workers.dev/api/payment/razorpay/callback?user_id=${encodeURIComponent(String(params.telegramUserId))}&order_id=${encodeURIComponent(orderRes.orderId)}&plan_type=${encodeURIComponent(params.planType || 'lifetime')}`,
              callback_method: 'get',
            }),
          });

          if (plRes.ok) {
            const plData = (await plRes.json()) as { short_url?: string };
            if (plData.short_url) {
              mobilePaymentUrl = plData.short_url;
            }
          }
        } catch (e) {
          console.warn('[licenseManager] Failed to create direct mobile payment link:', e);
        }
      }

      // Fallback to static store payment link if dynamic creation failed
      if (!mobilePaymentUrl) {
        mobilePaymentUrl = 'https://rzp.io/rzp/eBLEV0w';
      }

      params.onOpen?.();
      await openExternalUrl(mobilePaymentUrl);

      // Start automatic polling to unlock Pro as soon as UPI payment finishes in Google Pay / PhonePe / Paytm
      this.stopPaymentPolling();

      const startTime = Date.now();
      this.activePaymentPollTimer = setInterval(async () => {
        // Poll for up to 5 minutes
        if (Date.now() - startTime > 300000) {
          this.stopPaymentPolling();
          return;
        }

        const status = await this.checkUserAccountProStatus(params.telegramUserId);
        if (status.active && status.isPro && status.license) {
          this.stopPaymentPolling();
          if (params.planType && status.license.planType !== params.planType) {
            status.license.planType = params.planType;
            if (params.planType === 'monthly') {
              status.license.expiresAt = Math.floor(Date.now() / 1000) + 30 * 86400;
            } else if (params.planType === 'annual') {
              status.license.expiresAt = Math.floor(Date.now() / 1000) + 365 * 86400;
            }
            localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(status.license));
            this.currentLicense = status.license;
            this.notifyLicenseUpdated(status.license);
          }
          params.onSuccess?.(status.license);
        }
      }, 2500);

      return;
    }

    const RazorpayCtor = (window as unknown as {
      Razorpay?: new (opts: unknown) => {
        open: () => void;
        on?: (event: string, cb: (data: unknown) => void) => void;
      };
    }).Razorpay;

    if (sdkLoaded && RazorpayCtor) {
      let paymentCompleted = false;

      const checkoutConfigId = orderRes.checkoutConfigId || 'config_TiUSpvBT1EEuwz';

      const options = {
        key: orderRes.keyId || 'rzp_live_default',
        amount: orderRes.amount,
        currency: orderRes.currency || 'INR',
        name: 'TG Drive Cloud',
        description: `${params.planName || 'Lifetime Pro'} Upgrade`,
        image: 'https://tg-drive.vercel.app/logo.png',
        order_id: orderRes.orderId,
        checkout_config_id: checkoutConfigId,
        config_id: checkoutConfigId,
        prefill: {
          name: params.customerName || '',
          email: params.customerEmail || '',
          contact: params.phoneNumber || '',
        },
        theme: {
          color: '#8b5cf6',
        },
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          emi: true,
          paylater: true,
        },
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          paymentCompleted = true;
          const verifyRes = await this.verifyRazorpayPayment({
            orderId: response.razorpay_order_id || orderRes.orderId!,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            telegramUserId: params.telegramUserId,
            planType: params.planType || 'lifetime',
            customerName: params.customerName,
            customerEmail: params.customerEmail,
            phoneNumber: params.phoneNumber,
          });

          if (verifyRes.success && verifyRes.license) {
            if (params.planType && verifyRes.license.planType !== params.planType) {
              verifyRes.license.planType = params.planType;
              if (params.planType === 'monthly') {
                verifyRes.license.expiresAt = Math.floor(Date.now() / 1000) + 30 * 86400;
              } else if (params.planType === 'annual') {
                verifyRes.license.expiresAt = Math.floor(Date.now() / 1000) + 365 * 86400;
              }
              localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(verifyRes.license));
              this.currentLicense = verifyRes.license;
              this.notifyLicenseUpdated(verifyRes.license);
            }
            params.onSuccess?.(verifyRes.license);
          } else {
            params.onError?.(verifyRes.error || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Razorpay modal closed');
            if (!paymentCompleted) {
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
          console.warn('Razorpay payment failed:', response);
          const errObj = response as { error?: { description?: string } };
          const errMsg = errObj?.error?.description || 'Payment failed or was declined.';
          params.onError?.(errMsg);
        });
      }

      rzpInstance.open();
      params.onOpen?.();
    } else {
      // Fallback: If SDK script blocked or in web view, create checkout link & open in browser
      const fallbackUrl = `${this.apiEndpoint}/api/store/create-checkout-link`;
      try {
        const linkRes = await fetch(fallbackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: params.customerName || 'TG Drive User',
            email: params.customerEmail || `tg_${params.telegramUserId}@telegram.org`,
            telegram_user_id: String(params.telegramUserId),
            phone_number: params.phoneNumber,
          }),
        });
        const linkData = (await linkRes.json()) as { payment_url?: string };
        if (linkData.payment_url) {
          params.onOpen?.();
          window.open(linkData.payment_url, '_blank');
          params.onDismiss?.();
        } else {
          params.onError?.('Unable to generate checkout URL');
        }
      } catch {
        params.onError?.('Unable to open checkout modal');
      }
    }
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
    const current = await this.loadLicense();
    if (!current.isLicensed || !current.licenseKey) return false;

    try {
      const response = await fetch(`${this.apiEndpoint}/api/license/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_key: current.licenseKey,
          hardware_id: current.hardwareId,
          token: current.token,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { valid: boolean; reason?: string };
        if (!data.valid) {
          // License was banned or revoked
          current.isLicensed = false;
          localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(current));
          return false;
        }
        current.lastVerifiedAt = Math.floor(Date.now() / 1000);
        localStorage.setItem(STORAGE_KEY_LICENSE, JSON.stringify(current));
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

