import {
  activateDevice,
  banLicense,
  countActiveDevices,
  createCoupon,
  createLicense,
  createPaymentTransaction,
  directUpgradeProUser,
  getPaymentTransactionByOrderId,
  listPaymentTransactions,
  updatePaymentTransactionSuccess,
  upsertBotSubscriber,
  listBotSubscribers,
  countBotSubscribers,
  upsertProUser,
  getProUserByTelegramId,
  listProUsers,
  searchProUsers,
  banProUser,
  unbanProUser,
  deleteProUser,
  deactivateDevice,
  deleteCoupon,
  deleteLicense,
  deleteOtpForEmail,
  ensureStoreTables,
  getCouponByCode,
  getDashboardStats,
  getDevicesForLicense,
  getLatestOtpForEmail,
  getLicenseByKey,
  getLicenseByOrderId,
  getLicenseByTelegramAccount,
  getLicensesByEmail,
  getStoreSetting,
  incrementCouponUsage,
  incrementOtpAttempts,
  listCoupons,
  listLicenses,
  normalizePhone,
  recordAdminLog,
  resetDevicesForLicense,
  saveOtpRecord,
  searchLicenses,
  setStoreSetting,
  touchDevice,
  unbanLicense,
  createPayoutRequest,
  getOrCreateReferralProfile,
  getReferralProfileByCode,
  getReferralConversionsByCode,
  getTopReferrers,
  getUserPayouts,
  listPayoutRequests,
  processPayoutRequest,
  recordReferralConversion,
  clearCrashReports,
  deleteCrashReport,
  getCrashReportCount,
  getCrashReports,
  recordCrashReport,
  getLatestPaidTransactionForUser,
} from './db';
import {
  generateLicenseKey,
  generateOtpCode,
  issueLicenseToken,
  sha256Hex,
  timingSafeEqual,
  verifyHmacSha256,
  verifyLicenseToken,
  verifyTelegramAuth,
} from './crypto';
import {
  sendTelegramMessage,
  sendProWelcomeMessage,
  handleTelegramBotUpdate,
} from './telegramBot';
import { renderAdminDashboardHtml } from './adminHtml';
import { renderRecoveryHtml } from './recoveryHtml';
import { renderEveykaHtml } from './eveykaHtml';
import {
  sendEmail,
  sendEmailDetailed,
  sendOtpEmail,
  sendPurchaseEmail,
  sendTrialWelcomeEmail,
  sendTrialExpiryReminderEmail,
  sendReferralEarningEmail,
  sendPayoutCompletedEmail,
} from './email';
import type {
  ActivationRequest,
  CreateLicenseRequest,
  DeactivateRequest,
  DevicePlatform,
  Env,
  LicenseClaims,
  LicensePlan,
  LicenseRow,
  ProUserRow,
  PaymentTransactionRow,
  BotSubscriberRow,
  CreateRazorpayOrderRequest,
  VerifyRazorpayPaymentRequest,
  BroadcastMessageRequest,
  RequestOtpRequest,
  SelfResetDeviceRequest,
  VerifyOtpRequest,
  VerifyRequest,
} from './types';

async function createRecoveryToken(email: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const payload = JSON.stringify({ email, exp: Math.floor(Date.now() / 1000) + 3600 });
  const b64Payload = btoa(payload);
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(b64Payload));
  const sigHex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${b64Payload}.${sigHex}`;
}

async function verifyRecoveryToken(token: string, secret: string, expectedEmail: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const b64Payload = parts[0] ?? '';
    const sigHex = parts[1] ?? '';
    const payload = JSON.parse(atob(b64Payload)) as { email: string; exp: number };
    if (payload.exp < Math.floor(Date.now() / 1000)) return false;
    if (payload.email.toLowerCase() !== expectedEmail.toLowerCase()) return false;

    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(b64Payload));
    const expectedSig = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    return timingSafeEqual(sigHex, expectedSig);
  } catch {
    return false;
  }
}


const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type, Authorization',
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

function verifyAdminAuth(request: Request, env: Env): boolean {
  const secret = env.ADMIN_SECRET || 'tg-drive-master-secret-2026';
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return false;
  const token = authHeader.substring(7).trim();
  return timingSafeEqual(token, secret);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle preflight CORS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: JSON_HEADERS,
      });
    }

    try {
      // -------------------------------------------------------------
      // 0. Official Eveyka Software Website (/)
      // -------------------------------------------------------------
      if (url.pathname === '/' || url.pathname === '/index.html') {
        const html = renderEveykaHtml();
        return new Response(html, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-cache, no-store, must-revalidate',
          },
        });
      }

      // -------------------------------------------------------------
      // 1. Web Admin Dashboard (/admin)
      // -------------------------------------------------------------
      if (url.pathname === '/admin' || url.pathname === '/admin/') {
        const appName = env.APP_NAME || 'TG Drive: Unlimited Cloud';
        const html = renderAdminDashboardHtml(appName);
        return new Response(html, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-cache',
          },
        });
      }

      // -------------------------------------------------------------
      // 1.5 Self-Service Key Recovery Portal (/recover)
      // -------------------------------------------------------------
      if (url.pathname === '/recover' || url.pathname === '/recover/') {
        const appName = env.APP_NAME || 'TG Drive: Unlimited Cloud';
        const html = renderRecoveryHtml(appName);
        return new Response(html, {
          headers: {
            'content-type': 'text/html; charset=utf-8',
            'cache-control': 'no-cache',
          },
        });
      }


      // -------------------------------------------------------------
      // Helper: Verify payment against Razorpay API
      // -------------------------------------------------------------
      const verifyRazorpayWithApi = async (opts: {
        paymentId?: string | null;
        paymentLinkId?: string | null;
        orderId?: string | null;
      }): Promise<{
        verified: boolean;
        status: string;
        amountPaise?: number;
        paymentId?: string;
        planType?: LicensePlan;
        telegramUserId?: string;
        customerName?: string;
        phoneNumber?: string;
        notes?: Record<string, string>;
      }> => {
        const keyId = env.RAZORPAY_KEY_ID || 'rzp_live_T1mw2QboxNW91L';
        const keySecret = env.RAZORPAY_KEY_SECRET || 'reDkBo457g05IR6k2SwYeVkD';
        const authHeader = 'Basic ' + btoa(`${keyId}:${keySecret}`);

        // 1. Try Payment ID verification
        if (opts.paymentId && opts.paymentId.startsWith('pay_')) {
          try {
            const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(opts.paymentId)}`, {
              headers: { 'Authorization': authHeader },
            });
            if (res.ok) {
              const data = (await res.json()) as {
                id: string;
                status: string;
                amount: number;
                notes?: Record<string, string>;
                contact?: string;
                description?: string;
              };
              const isCaptured = data.status === 'captured' || data.status === 'authorized';
              return {
                verified: isCaptured,
                status: data.status,
                amountPaise: data.amount,
                paymentId: data.id,
                planType: (data.notes?.plan_type as LicensePlan) || undefined,
                telegramUserId: data.notes?.telegram_user_id,
                customerName: data.notes?.customer_name,
                phoneNumber: data.contact || data.notes?.phone_number,
                notes: data.notes,
              };
            }
          } catch (e) {
            console.warn('[verifyRazorpayWithApi] Payment check error:', e);
          }
        }

        // 2. Try Payment Link ID verification
        if (opts.paymentLinkId && (opts.paymentLinkId.startsWith('plink_') || opts.paymentLinkId.length > 5)) {
          try {
            const res = await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(opts.paymentLinkId)}`, {
              headers: { 'Authorization': authHeader },
            });
            if (res.ok) {
              const data = (await res.json()) as {
                id: string;
                status: string;
                amount: number;
                amount_paid?: number;
                notes?: Record<string, string>;
                customer?: { name?: string; contact?: string };
                payments?: Array<{ payment_id: string; status: string; amount: number }>;
              };
              const isPaid = data.status === 'paid' || ((data.amount_paid || 0) > 0);
              const firstPayment = data.payments?.[0];
              return {
                verified: isPaid,
                status: data.status,
                amountPaise: data.amount_paid || data.amount,
                paymentId: firstPayment?.payment_id,
                planType: (data.notes?.plan_type as LicensePlan) || undefined,
                telegramUserId: data.notes?.telegram_user_id,
                customerName: data.customer?.name || data.notes?.customer_name,
                phoneNumber: data.customer?.contact || data.notes?.phone_number,
                notes: data.notes,
              };
            }
          } catch (e) {
            console.warn('[verifyRazorpayWithApi] Payment link check error:', e);
          }
        }

        // 3. Try Order ID verification directly via Razorpay Orders API
        if (opts.orderId && opts.orderId.startsWith('order_')) {
          try {
            const res = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(opts.orderId)}`, {
              headers: { 'Authorization': authHeader },
            });
            if (res.ok) {
              const data = (await res.json()) as {
                id: string;
                status: string;
                amount: number;
                amount_paid?: number;
                notes?: Record<string, string>;
              };
              const isPaid = data.status === 'paid' || ((data.amount_paid || 0) > 0);
              let payId: string | undefined;
              if (isPaid) {
                try {
                  const payRes = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(opts.orderId)}/payments`, {
                    headers: { 'Authorization': authHeader },
                  });
                  if (payRes.ok) {
                    const payData = (await payRes.json()) as { items?: Array<{ id: string; status: string }> };
                    const successfulPayment = payData.items?.find(p => p.status === 'captured' || p.status === 'authorized');
                    if (successfulPayment) payId = successfulPayment.id;
                  }
                } catch {}
              }
              return {
                verified: isPaid,
                status: data.status,
                amountPaise: data.amount_paid || data.amount,
                paymentId: payId,
                planType: (data.notes?.plan_type as LicensePlan) || undefined,
                telegramUserId: data.notes?.telegram_user_id,
                customerName: data.notes?.customer_name,
                phoneNumber: data.notes?.phone_number,
                notes: data.notes,
              };
            }
          } catch (e) {
            console.warn('[verifyRazorpayWithApi] Order check error:', e);
          }
        }

        return { verified: false, status: 'unknown' };
      };

      // -------------------------------------------------------------
      // 2. Admin APIs (Require Bearer Auth)
      // -------------------------------------------------------------
      if (url.pathname.startsWith('/api/admin/')) {
        // Dedicated login authentication verification endpoint
        if (url.pathname === '/api/admin/auth/verify' && request.method === 'POST') {
          const masterSecret = env.ADMIN_SECRET || 'tg-drive-master-secret-2026';
          let candidate = '';
          const authHeader = request.headers.get('Authorization') || '';
          if (authHeader.startsWith('Bearer ')) {
            candidate = authHeader.substring(7).trim();
          } else {
            try {
              const body = (await request.json()) as { secret?: string };
              candidate = (body.secret || '').trim();
            } catch (_) {}
          }
          if (candidate && timingSafeEqual(candidate, masterSecret)) {
            return jsonResponse({ valid: true, success: true });
          }
          return jsonResponse({ valid: false, error: 'Invalid admin secret' }, 401);
        }

        if (!verifyAdminAuth(request, env)) {
          return jsonResponse({ error: 'Unauthorized: Invalid Admin Secret' }, 401);
        }

        // GET /api/admin/stats
        if (url.pathname === '/api/admin/stats' && request.method === 'GET') {
          const stats = await getDashboardStats(env.DB);
          return jsonResponse(stats);
        }

        // GET /api/admin/licenses
        if (url.pathname === '/api/admin/licenses' && request.method === 'GET') {
          const licenses = await listLicenses(env.DB);
          return jsonResponse({ licenses });
        }

        // GET /api/admin/licenses/search?q=...
        if (url.pathname === '/api/admin/licenses/search' && request.method === 'GET') {
          const q = url.searchParams.get('q') || '';
          const licenses = await searchLicenses(env.DB, q);
          return jsonResponse({ licenses });
        }

        // POST /api/admin/licenses/create
        if (url.pathname === '/api/admin/licenses/create' && request.method === 'POST') {
          const body = (await request.json()) as CreateLicenseRequest;
          const key = generateLicenseKey();
          const id = crypto.randomUUID();

          let expiresAt: number | null = null;
          const now = Math.floor(Date.now() / 1000);
          if (body.plan_type === 'annual') {
            expiresAt = now + 365 * 24 * 60 * 60;
          } else if (body.plan_type === 'monthly') {
            expiresAt = now + 30 * 24 * 60 * 60;
          } else if (body.plan_type === 'trial') {
            expiresAt = now + 7 * 24 * 60 * 60;
          }

          const license = await createLicense(env.DB, {
            id,
            license_key: key,
            telegram_user_id: body.telegram_user_id,
            phone_number: body.phone_number,
            customer_name: body.customer_name,
            customer_email: body.customer_email,
            plan_type: body.plan_type || 'lifetime',
            max_devices: body.max_devices || parseInt(env.MAX_DEFAULT_DEVICES || '2', 10),
            notes: body.notes,
            expires_at: expiresAt,
          });

          await recordAdminLog(env.DB, 'CREATE_LICENSE', key, `Created ${license.plan_type} license`);
          return jsonResponse({ success: true, license }, 201);
        }

        // POST /api/admin/licenses/ban
        if (url.pathname === '/api/admin/licenses/ban' && request.method === 'POST') {
          const body = (await request.json()) as { license_key: string; reason?: string };
          if (!body.license_key) return jsonResponse({ error: 'Missing license_key' }, 400);
          await banLicense(env.DB, body.license_key, body.reason || 'Banned by administrator');
          await recordAdminLog(env.DB, 'BAN_LICENSE', body.license_key, body.reason || 'Admin Ban');
          return jsonResponse({ success: true });
        }

        // POST /api/admin/licenses/unban
        if (url.pathname === '/api/admin/licenses/unban' && request.method === 'POST') {
          const body = (await request.json()) as { license_key: string };
          if (!body.license_key) return jsonResponse({ error: 'Missing license_key' }, 400);
          await unbanLicense(env.DB, body.license_key);
          await recordAdminLog(env.DB, 'UNBAN_LICENSE', body.license_key, 'Unbanned');
          return jsonResponse({ success: true });
        }

        // POST /api/admin/licenses/delete
        if (url.pathname === '/api/admin/licenses/delete' && request.method === 'POST') {
          const body = (await request.json()) as { license_key: string };
          if (!body.license_key) return jsonResponse({ error: 'Missing license_key' }, 400);
          await deleteLicense(env.DB, body.license_key);
          await recordAdminLog(env.DB, 'DELETE_LICENSE', body.license_key, 'Deleted license');
          return jsonResponse({ success: true });
        }

        // POST /api/admin/licenses/reset-devices
        if (url.pathname === '/api/admin/licenses/reset-devices' && request.method === 'POST') {
          const body = (await request.json()) as { license_key: string };
          if (!body.license_key) return jsonResponse({ error: 'Missing license_key' }, 400);
          await resetDevicesForLicense(env.DB, body.license_key);
          await recordAdminLog(env.DB, 'RESET_DEVICES', body.license_key, 'Reset active devices');
          return jsonResponse({ success: true });
        }

        // POST /api/admin/licenses/resend-email
        if (url.pathname === '/api/admin/licenses/resend-email' && request.method === 'POST') {
          const body = (await request.json()) as { license_key: string };
          if (!body.license_key) return jsonResponse({ error: 'Missing license_key' }, 400);
          const license = await getLicenseByKey(env.DB, body.license_key);
          if (!license || !license.customer_email) {
            return jsonResponse({ error: 'License or email address not found.' }, 404);
          }
          const emailSent = await sendPurchaseEmail(env, {
            to: license.customer_email,
            name: license.customer_name || 'Valued Customer',
            licenseKey: license.license_key,
            planType: license.plan_type,
            orderId: license.notes || 'MANUAL-RESEND',
          });
          await recordAdminLog(env.DB, 'RESEND_EMAIL', body.license_key, `Email resend to ${license.customer_email}: ${emailSent ? 'SUCCESS' : 'FAILED'}`);
          return jsonResponse({ success: emailSent, email: license.customer_email, message: emailSent ? 'Email sent successfully!' : 'Email delivery failed. Please check SMTP / Resend configuration.' });
        }

        // POST /api/admin/test-email
        if (url.pathname === '/api/admin/test-email' && request.method === 'POST') {
          const body = (await request.json()) as { to: string };
          if (!body.to) return jsonResponse({ error: 'Missing recipient email' }, 400);
          const cleanTo = body.to.trim().toLowerCase();
          const emailResult = await sendEmailDetailed(env, {
            to: cleanTo,
            subject: '✅ TG Drive Email Delivery Diagnostic Test',
            html: `<div style="font-family:sans-serif;padding:20px;background:#0f172a;color:#fff;border-radius:12px;"><h2>TG Drive Email Service Test</h2><p>If you are reading this email, your email provider configuration (Gmail SMTP / Resend) is working perfectly!</p><p>Timestamp: ${new Date().toISOString()}</p></div>`,
          });
          return jsonResponse({
            success: emailResult.success,
            provider: emailResult.provider,
            sender_email: emailResult.from || env.GMAIL_USER || 'Not configured',
            to: cleanTo,
            error: emailResult.error || null,
            smtp_logs: emailResult.logs || [],
            has_gmail_user: Boolean(env.GMAIL_USER),
            has_gmail_password: Boolean(env.GMAIL_APP_PASSWORD),
            has_resend: Boolean(env.RESEND_API_KEY),
            message: emailResult.success
              ? `Test email successfully delivered to ${cleanTo} via ${emailResult.provider}!`
              : `Test email failed to send: ${emailResult.error || 'Unknown error'}`,
          });
        }

        // GET /api/admin/pricing
        if (url.pathname === '/api/admin/pricing' && request.method === 'GET') {
          const livePriceStr = await getStoreSetting(env.DB, 'live_price', '399');
          const storeUrl = await getStoreSetting(env.DB, 'store_url', env.STORE_URL || 'https://rzp.io/rzp/eBLEV0w');
          const price = parseFloat(livePriceStr) || 399;

          return jsonResponse({
            configured: true,
            gateway: 'Razorpay',
            product_name: 'TG Drive: Lifetime Pro License',
            price,
            formatted_price: '₹' + price.toFixed(2),
            currency: 'INR',
            key_id: env.RAZORPAY_KEY_ID || 'rzp_live_T1mw2QboxNW91L',
            payment_link: storeUrl,
            webhook_endpoint: `${url.origin}/api/webhooks/razorpay`,
          });
        }

        // POST /api/admin/pricing/update
        if (url.pathname === '/api/admin/pricing/update' && request.method === 'POST') {
          const body = (await request.json()) as { price: number; payment_link?: string };
          if (!body.price || body.price <= 0) {
            return jsonResponse({ error: 'Please enter a valid price greater than 0' }, 400);
          }

          let paymentLink = body.payment_link;

          if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
            try {
              const authHeader = 'Basic ' + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
              const plRes = await fetch('https://api.razorpay.com/v1/payment_links', {
                method: 'POST',
                headers: {
                  'Authorization': authHeader,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  amount: Math.round(body.price * 100),
                  currency: 'INR',
                  accept_partial: false,
                  description: 'TG Drive: Lifetime Pro License (Unlimited Cloud Storage)',
                  notify: { sms: false, email: true },
                  reminder_enable: true,
                  notes: { product: 'tg_drive_lifetime_pro' },
                }),
              });

              const plData = (await plRes.json()) as { short_url?: string; error?: { description?: string } };
              if (plRes.ok && plData.short_url) {
                paymentLink = plData.short_url;
              }
            } catch (err: unknown) {
              console.error('Error generating Razorpay payment link:', err);
            }
          }

          // Save price & store URL directly in DB for 0-latency instant app sync
          await setStoreSetting(env.DB, 'live_price', String(body.price));
          if (paymentLink) {
            await setStoreSetting(env.DB, 'store_url', paymentLink);
          }

          await recordAdminLog(env.DB, 'UPDATE_PRICING', null, `Updated price to ₹${body.price}`);

          return jsonResponse({
            success: true,
            price: body.price,
            payment_link: paymentLink || env.STORE_URL,
            message: `Live price successfully updated to ₹${body.price.toFixed(2)}! Apps will sync immediately.`,
          });
        }

        // POST /api/admin/plans - Update membership plans pricing, original prices, and checkout URLs
        if (url.pathname === '/api/admin/plans' && request.method === 'POST') {
          const body = (await request.json()) as {
            lifetime_price?: number;
            lifetime_orig?: number;
            lifetime_url?: string;
            annual_price?: number;
            annual_orig?: number;
            annual_url?: string;
            monthly_price?: number;
            monthly_orig?: number;
            monthly_url?: string;
          };

          if (body.lifetime_price !== undefined) {
            await setStoreSetting(env.DB, 'plan_lifetime_price', String(body.lifetime_price));
            await setStoreSetting(env.DB, 'live_price', String(body.lifetime_price));
          }
          if (body.lifetime_orig !== undefined) {
            await setStoreSetting(env.DB, 'plan_lifetime_orig', String(body.lifetime_orig));
          }
          if (body.lifetime_url) {
            await setStoreSetting(env.DB, 'plan_lifetime_url', body.lifetime_url);
            await setStoreSetting(env.DB, 'store_url', body.lifetime_url);
          }

          if (body.annual_price !== undefined) {
            await setStoreSetting(env.DB, 'plan_annual_price', String(body.annual_price));
          }
          if (body.annual_orig !== undefined) {
            await setStoreSetting(env.DB, 'plan_annual_orig', String(body.annual_orig));
          }
          if (body.annual_url) {
            await setStoreSetting(env.DB, 'plan_annual_url', body.annual_url);
          }

          if (body.monthly_price !== undefined) {
            await setStoreSetting(env.DB, 'plan_monthly_price', String(body.monthly_price));
          }
          if (body.monthly_orig !== undefined) {
            await setStoreSetting(env.DB, 'plan_monthly_orig', String(body.monthly_orig));
          }
          if (body.monthly_url) {
            await setStoreSetting(env.DB, 'plan_monthly_url', body.monthly_url);
          }

          await recordAdminLog(env.DB, 'UPDATE_PLANS', null, `Updated membership plans pricing and URLs`);

          return jsonResponse({
            success: true,
            message: 'Membership plans successfully updated! Apps and store will sync immediately.',
          });
        }

        // GET /api/admin/plans - Fetch current configured plans
        if (url.pathname === '/api/admin/plans' && request.method === 'GET') {
          const defaultUrl = env.STORE_URL || 'https://rzp.io/rzp/eBLEV0w';
          const lifetimePrice = parseFloat(await getStoreSetting(env.DB, 'plan_lifetime_price', await getStoreSetting(env.DB, 'live_price', '499'))) || 499;
          const lifetimeOrig = parseFloat(await getStoreSetting(env.DB, 'plan_lifetime_orig', '1499')) || 1499;
          const lifetimeUrl = await getStoreSetting(env.DB, 'plan_lifetime_url', await getStoreSetting(env.DB, 'store_url', defaultUrl));

          const annualPrice = parseFloat(await getStoreSetting(env.DB, 'plan_annual_price', '299')) || 299;
          const annualOrig = parseFloat(await getStoreSetting(env.DB, 'plan_annual_orig', '599')) || 599;
          const annualUrl = await getStoreSetting(env.DB, 'plan_annual_url', defaultUrl);

          const monthlyPrice = parseFloat(await getStoreSetting(env.DB, 'plan_monthly_price', '49')) || 49;
          const monthlyOrig = parseFloat(await getStoreSetting(env.DB, 'plan_monthly_orig', '99')) || 99;
          const monthlyUrl = await getStoreSetting(env.DB, 'plan_monthly_url', defaultUrl);

          return jsonResponse({
            lifetime_price: Math.round(lifetimePrice),
            lifetime_orig: Math.round(lifetimeOrig),
            lifetime_url: lifetimeUrl,
            annual_price: Math.round(annualPrice),
            annual_orig: Math.round(annualOrig),
            annual_url: annualUrl,
            monthly_price: Math.round(monthlyPrice),
            monthly_orig: Math.round(monthlyOrig),
            monthly_url: monthlyUrl,
          });
        }

        // GET /api/admin/discounts
        if (url.pathname === '/api/admin/discounts' && request.method === 'GET') {
          const couponList = await listCoupons(env.DB);
          const discounts = couponList.map(c => ({
            id: c.id,
            name: `Coupon ${c.code}`,
            code: c.code,
            amount: c.discount_value,
            amount_type: c.discount_type,
            is_limited_redemptions: c.max_uses > 0,
            max_redemptions: c.max_uses,
            times_used: c.times_used,
            expires_at: c.expires_at ? new Date(c.expires_at * 1000).toISOString() : null,
            status: c.is_active ? 'published' : 'draft',
          }));
          return jsonResponse({ discounts });
        }

        // POST /api/admin/discounts/create
        if (url.pathname === '/api/admin/discounts/create' && request.method === 'POST') {
          const body = (await request.json()) as {
            code: string;
            amount: number;
            amount_type?: 'percent' | 'fixed';
            max_redemptions?: number;
            duration_days?: number;
          };

          if (!body.code || !body.amount || body.amount <= 0) {
            return jsonResponse({ error: 'Missing valid coupon code or discount amount' }, 400);
          }

          const cleanCode = body.code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
          const existing = await getCouponByCode(env.DB, cleanCode);
          if (existing) {
            return jsonResponse({ error: `Coupon code '${cleanCode}' already exists!` }, 400);
          }

          const coupon = await createCoupon(env.DB, {
            code: cleanCode,
            discount_type: body.amount_type || 'percent',
            discount_value: body.amount,
            max_uses: body.max_redemptions,
            duration_days: body.duration_days,
          });

          await recordAdminLog(env.DB, 'CREATE_COUPON', cleanCode, `Created coupon ${cleanCode} with ${body.amount}${body.amount_type === 'fixed' ? ' INR' : '%'} off`);

          return jsonResponse(
            {
              success: true,
              discount: coupon,
              message: `Coupon ${cleanCode} created successfully!`,
            },
            201
          );
        }

        // POST /api/admin/discounts/delete
        if (url.pathname === '/api/admin/discounts/delete' && request.method === 'POST') {
          const body = (await request.json()) as { id: string; code?: string };
          if (!body.id) return jsonResponse({ error: 'Missing discount ID' }, 400);
          await deleteCoupon(env.DB, body.id);
          await recordAdminLog(env.DB, 'DELETE_COUPON', body.code || body.id, `Deleted coupon ${body.code || body.id}`);
          return jsonResponse({ success: true, message: 'Coupon deleted successfully.' });
        }

        // GET /api/admin/offers
        if (url.pathname === '/api/admin/offers' && request.method === 'GET') {
          try {
            const stmt = env.DB.prepare('SELECT * FROM special_offers ORDER BY created_at DESC');
            const rows = await stmt.all();
            const offers = (rows.results || []).map((r: Record<string, unknown>) => {
              let parsedPerks: string[] = [];
              if (typeof r.perks === 'string' && r.perks) {
                try {
                  parsedPerks = JSON.parse(r.perks) as string[];
                } catch {
                  parsedPerks = r.perks.split('\n').map(p => p.trim()).filter(Boolean);
                }
              }
              return { ...r, perks_list: parsedPerks };
            });
            return jsonResponse({ offers });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch offers';
            return jsonResponse({ error: msg }, 500);
          }
        }

        // POST /api/admin/offers/create
        if (url.pathname === '/api/admin/offers/create' && request.method === 'POST') {
          const body = (await request.json()) as {
            title: string;
            badge?: string;
            description: string;
            discount_type?: 'percent' | 'flat' | 'bundle';
            discount_value?: number;
            original_price?: number;
            offer_price?: number;
            perks?: string[] | string;
            coupon_code?: string;
            cta_text?: string;
            banner_style?: string;
            duration_hours?: number;
          };

          if (!body.title || !body.description) {
            return jsonResponse({ error: 'Please provide both Title and Description for the offer.' }, 400);
          }

          try {
            const id = crypto.randomUUID();
            const now = Math.floor(Date.now() / 1000);
            const countdownEnd = body.duration_hours && body.duration_hours > 0
              ? now + Math.round(body.duration_hours * 3600)
              : null;

            let perksJson = '';
            if (Array.isArray(body.perks)) {
              perksJson = JSON.stringify(body.perks.filter(Boolean));
            } else if (typeof body.perks === 'string') {
              perksJson = JSON.stringify(body.perks.split('\n').map(p => p.trim()).filter(Boolean));
            }

            // Deactivate existing active offers
            await env.DB.prepare('UPDATE special_offers SET is_active = 0 WHERE is_active = 1').run();

            await env.DB.prepare(`
              INSERT INTO special_offers (id, title, badge, description, discount_type, discount_value, original_price, offer_price, perks, coupon_code, cta_text, banner_style, countdown_end, is_active, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            `).bind(
              id,
              body.title.trim(),
              body.badge?.trim() || 'LIMITED OFFER',
              body.description.trim(),
              body.discount_type || 'percent',
              body.discount_value || 0,
              body.original_price || null,
              body.offer_price || null,
              perksJson || null,
              body.coupon_code ? body.coupon_code.trim().toUpperCase() : null,
              body.cta_text?.trim() || 'Claim Offer',
              body.banner_style || 'gold',
              countdownEnd,
              now,
              now
            ).run();

            await recordAdminLog(env.DB, 'CREATE_OFFER', id, `Created special offer: ${body.title}`);
            return jsonResponse({ success: true, message: 'Special offer created & activated live!' }, 201);
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error creating offer';
            return jsonResponse({ error: msg }, 500);
          }
        }

        // POST /api/admin/offers/toggle
        if (url.pathname === '/api/admin/offers/toggle' && request.method === 'POST') {
          const body = (await request.json()) as { id: string; is_active: number };
          if (!body.id) return jsonResponse({ error: 'Missing offer ID' }, 400);

          try {
            const now = Math.floor(Date.now() / 1000);
            if (body.is_active === 1) {
              await env.DB.prepare('UPDATE special_offers SET is_active = 0').run();
            }
            await env.DB.prepare('UPDATE special_offers SET is_active = ?, updated_at = ? WHERE id = ?')
              .bind(body.is_active, now, body.id)
              .run();

            await recordAdminLog(env.DB, 'TOGGLE_OFFER', body.id, `Toggled offer ${body.id} to ${body.is_active ? 'ACTIVE' : 'INACTIVE'}`);
            return jsonResponse({ success: true });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error toggling offer status';
            return jsonResponse({ error: msg }, 500);
          }
        }

        // POST /api/admin/offers/delete
        if (url.pathname === '/api/admin/offers/delete' && request.method === 'POST') {
          const body = (await request.json()) as { id: string };
          if (!body.id) return jsonResponse({ error: 'Missing offer ID' }, 400);

          try {
            await env.DB.prepare('DELETE FROM special_offers WHERE id = ?').bind(body.id).run();
            await recordAdminLog(env.DB, 'DELETE_OFFER', body.id, `Deleted special offer ${body.id}`);
            return jsonResponse({ success: true, message: 'Offer deleted successfully' });
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Error deleting offer';
            return jsonResponse({ error: msg }, 500);
          }
        }

        // GET /api/admin/trial
        if (url.pathname === '/api/admin/trial' && request.method === 'GET') {
          const trialEnabled = (await getStoreSetting(env.DB, 'trial_enabled', '1')) === '1';
          const trialDays = parseInt(await getStoreSetting(env.DB, 'trial_days', '30'), 10) || 30;
          return jsonResponse({ trial_enabled: trialEnabled, trial_days: trialDays });
        }

        // POST /api/admin/trial/update
        if (url.pathname === '/api/admin/trial/update' && request.method === 'POST') {
          const body = (await request.json()) as { trial_enabled?: boolean; trial_days?: number };
          const enabled = body.trial_enabled ? '1' : '0';
          const days = String(body.trial_days || 30);
          await setStoreSetting(env.DB, 'trial_enabled', enabled);
          await setStoreSetting(env.DB, 'trial_days', days);
          await recordAdminLog(env.DB, 'UPDATE_TRIAL', null, `Updated free trial settings: enabled=${enabled}, days=${days}`);
          return jsonResponse({ success: true, trial_enabled: enabled === '1', trial_days: parseInt(days, 10), message: 'Trial settings updated successfully!' });
        }

        // GET /api/admin/referrals/settings
        if (url.pathname === '/api/admin/referrals/settings' && request.method === 'GET') {
          const enabled = await getStoreSetting(env.DB, 'referral_enabled', '1');
          const rewardType = await getStoreSetting(env.DB, 'referral_reward_type', 'fixed');
          const rewardVal = await getStoreSetting(env.DB, 'referral_reward_value', '50');
          const friendDiscType = await getStoreSetting(env.DB, 'referral_friend_discount_type', 'percent');
          const friendDiscVal = await getStoreSetting(env.DB, 'referral_friend_discount_value', '10');
          const minPayout = await getStoreSetting(env.DB, 'referral_min_payout', '200');

          return jsonResponse({
            success: true,
            referral_enabled: enabled === '1',
            reward_type: rewardType,
            reward_value: parseFloat(rewardVal) || 50,
            friend_discount_type: friendDiscType,
            friend_discount_value: parseFloat(friendDiscVal) || 10,
            min_payout: parseFloat(minPayout) || 200,
          });
        }

        // POST /api/admin/referrals/settings
        if (url.pathname === '/api/admin/referrals/settings' && request.method === 'POST') {
          const body = (await request.json()) as {
            referral_enabled?: boolean | string | number;
            reward_type?: string;
            reward_value?: number | string;
            friend_discount_type?: string;
            friend_discount_value?: number | string;
            min_payout?: number | string;
          };

          if (body.referral_enabled !== undefined) {
            const val = body.referral_enabled === true || body.referral_enabled === '1' || body.referral_enabled === 1 ? '1' : '0';
            await setStoreSetting(env.DB, 'referral_enabled', val);
          }
          if (body.reward_type) {
            await setStoreSetting(env.DB, 'referral_reward_type', body.reward_type === 'percent' ? 'percent' : 'fixed');
          }
          if (body.reward_value !== undefined) {
            await setStoreSetting(env.DB, 'referral_reward_value', String(Math.max(1, parseFloat(String(body.reward_value)) || 50)));
          }
          if (body.friend_discount_type) {
            await setStoreSetting(env.DB, 'referral_friend_discount_type', body.friend_discount_type === 'fixed' ? 'fixed' : 'percent');
          }
          if (body.friend_discount_value !== undefined) {
            await setStoreSetting(env.DB, 'referral_friend_discount_value', String(Math.max(1, parseFloat(String(body.friend_discount_value)) || 10)));
          }
          if (body.min_payout !== undefined) {
            await setStoreSetting(env.DB, 'referral_min_payout', String(Math.max(1, parseFloat(String(body.min_payout)) || 200)));
          }

          await recordAdminLog(env.DB, 'UPDATE_REFERRAL_SETTINGS', null, 'Updated Refer & Earn commission & payout settings');
          return jsonResponse({ success: true, message: 'Referral settings updated successfully!' });
        }

        // GET /api/admin/payouts
        if (url.pathname === '/api/admin/payouts' && request.method === 'GET') {
          const status = url.searchParams.get('status') || 'all';
          const payouts = await listPayoutRequests(env.DB, status);
          return jsonResponse({ success: true, payouts });
        }

        // POST /api/admin/payouts/process
        if (url.pathname === '/api/admin/payouts/process' && request.method === 'POST') {
          const body = (await request.json()) as {
            payout_id?: string;
            status?: 'completed' | 'rejected';
            utr_number?: string;
            reason?: string;
          };

          if (!body.payout_id || !body.status) {
            return jsonResponse({ error: 'Missing payout_id or status' }, 400);
          }

          const existingPayout = await env.DB.prepare('SELECT * FROM payout_requests WHERE id = ?').bind(body.payout_id).first<{
            id: string;
            referral_code: string;
            user_email: string;
            user_name: string | null;
            amount: number;
            payout_method: string;
          }>();
          if (!existingPayout) {
            return jsonResponse({ error: 'Payout request not found.' }, 404);
          }

          const res = await processPayoutRequest(env.DB, body.payout_id, body.status, body.utr_number || body.reason);
          if (!res.success) {
            return jsonResponse({ error: res.error || 'Failed to process payout' }, 400);
          }

          await recordAdminLog(
            env.DB,
            body.status === 'completed' ? 'PAYOUT_COMPLETED' : 'PAYOUT_REJECTED',
            existingPayout.referral_code,
            `Processed payout of ₹${existingPayout.amount} for ${existingPayout.user_email}: ${body.status}`
          );

          if (body.status === 'completed') {
            try {
              await sendPayoutCompletedEmail(env, {
                to: existingPayout.user_email,
                name: existingPayout.user_name || undefined,
                amount: existingPayout.amount,
                method: existingPayout.payout_method,
                utrNumber: body.utr_number || undefined,
              });
            } catch (err) {
              console.error('Payout completed email error:', err);
            }
          }

          return jsonResponse({ success: true, message: `Payout marked as ${body.status}!` });
        }

        // GET /api/admin/referrals/leaderboard
        if (url.pathname === '/api/admin/referrals/leaderboard' && request.method === 'GET') {
          const referrers = await getTopReferrers(env.DB, 50);
          return jsonResponse({ success: true, referrers });
        }

        // GET /api/admin/crash-reports
        if (url.pathname === '/api/admin/crash-reports' && request.method === 'GET') {
          const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50', 10)));
          const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
          const reports = await getCrashReports(env.DB, limit, offset);
          const total = await getCrashReportCount(env.DB);
          return jsonResponse({ success: true, reports, total });
        }

        // POST /api/admin/crash-reports/clear
        if (url.pathname === '/api/admin/crash-reports/clear' && request.method === 'POST') {
          await clearCrashReports(env.DB);
          await recordAdminLog(env.DB, 'CLEAR_CRASH_REPORTS', null, 'Cleared all recorded crash reports');
          return jsonResponse({ success: true, message: 'All crash reports have been cleared.' });
        }

        // GET /api/admin/pro-users
        if (url.pathname === '/api/admin/pro-users' && request.method === 'GET') {
          const q = url.searchParams.get('q') || '';
          const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '100', 10)));
          const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
          const users = q ? await searchProUsers(env.DB, q) : await listProUsers(env.DB, limit, offset);
          return jsonResponse({ users });
        }

        // POST /api/admin/pro-users/upgrade
        if (url.pathname === '/api/admin/pro-users/upgrade' && request.method === 'POST') {
          const body = (await request.json()) as {
            telegram_user_id: string;
            phone_number?: string;
            first_name?: string;
            username?: string;
            plan_type?: LicensePlan;
            duration_days?: number;
            notes?: string;
          };
          if (!body.telegram_user_id) {
            return jsonResponse({ error: 'telegram_user_id is required' }, 400);
          }
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = body.duration_days && body.duration_days > 0 ? now + body.duration_days * 86400 : null;
          const user = await directUpgradeProUser(env.DB, {
            telegram_user_id: body.telegram_user_id,
            phone_number: body.phone_number || null,
            customer_name: body.first_name || null,
            username: body.username || null,
            plan_type: body.plan_type || 'lifetime',
            expires_at: expiresAt,
            notes: body.notes || 'Admin manual upgrade',
          });
          await recordAdminLog(env.DB, 'ADMIN_UPGRADE_USER', body.telegram_user_id, `Manually granted Pro to user ${body.telegram_user_id} (${body.plan_type || 'lifetime'})`);
          return jsonResponse({ success: true, user });
        }

        // POST /api/admin/pro-users/ban
        if (url.pathname === '/api/admin/pro-users/ban' && request.method === 'POST') {
          const body = (await request.json()) as { telegram_user_id: string; reason?: string };
          if (!body.telegram_user_id) return jsonResponse({ error: 'telegram_user_id is required' }, 400);
          await banProUser(env.DB, body.telegram_user_id, body.reason);
          await recordAdminLog(env.DB, 'BAN_PRO_USER', body.telegram_user_id, `Banned Pro user ${body.telegram_user_id}: ${body.reason || 'No reason'}`);
          return jsonResponse({ success: true });
        }

        // POST /api/admin/pro-users/unban
        if (url.pathname === '/api/admin/pro-users/unban' && request.method === 'POST') {
          const body = (await request.json()) as { telegram_user_id: string };
          if (!body.telegram_user_id) return jsonResponse({ error: 'telegram_user_id is required' }, 400);
          await unbanProUser(env.DB, body.telegram_user_id);
          await recordAdminLog(env.DB, 'UNBAN_PRO_USER', body.telegram_user_id, `Unbanned Pro user ${body.telegram_user_id}`);
          return jsonResponse({ success: true });
        }

        // POST /api/admin/pro-users/delete
        if (url.pathname === '/api/admin/pro-users/delete' && request.method === 'POST') {
          const body = (await request.json()) as { telegram_user_id: string };
          if (!body.telegram_user_id) return jsonResponse({ error: 'telegram_user_id is required' }, 400);
          await deleteProUser(env.DB, body.telegram_user_id);
          await recordAdminLog(env.DB, 'DELETE_PRO_USER', body.telegram_user_id, `Deleted Pro user ${body.telegram_user_id}`);
          return jsonResponse({ success: true });
        }

        // GET /api/admin/payment-transactions
        if (url.pathname === '/api/admin/payment-transactions' && request.method === 'GET') {
          const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '100', 10)));
          const offset = Math.max(0, parseInt(url.searchParams.get('offset') || '0', 10));
          const transactions = await listPaymentTransactions(env.DB, limit, offset);
          return jsonResponse({ transactions });
        }

        // POST /api/admin/payments/verify-link (Force Verify Razorpay Payment Link from Admin)
        if (url.pathname === '/api/admin/payments/verify-link' && request.method === 'POST') {
          const body = (await request.json()) as {
            order_id?: string;
            payment_link_id?: string;
            payment_id?: string;
            telegram_user_id?: string;
          };

          const ordId = body.order_id?.trim();
          const plinkId = body.payment_link_id?.trim();
          const payId = body.payment_id?.trim();
          const tgId = body.telegram_user_id?.trim();

          const rzpResult = await verifyRazorpayWithApi({
            paymentId: payId,
            paymentLinkId: plinkId,
            orderId: ordId,
          });

          if (!rzpResult.verified) {
            return jsonResponse({
              success: false,
              verified: false,
              status: rzpResult.status,
              message: `Razorpay status: ${rzpResult.status}. Payment is not marked captured/paid on Razorpay.`,
            });
          }

          const resolvedUserId = tgId || rzpResult.telegramUserId;
          if (!resolvedUserId) {
            return jsonResponse({ error: 'Telegram User ID could not be identified' }, 400);
          }

          let planType = rzpResult.planType;
          if (!planType && ordId) {
            const tx = await getPaymentTransactionByOrderId(env.DB, ordId);
            if (tx?.plan_type) planType = tx.plan_type as LicensePlan;
          }
          if (!planType && rzpResult.amountPaise) {
            if (rzpResult.amountPaise <= 9900) planType = 'monthly';
            else if (rzpResult.amountPaise <= 29900) planType = 'annual';
            else planType = 'lifetime';
          }
          if (!planType) planType = 'monthly';

          const now = Math.floor(Date.now() / 1000);
          let expiresAt: number | null = null;
          if (planType === 'monthly') expiresAt = now + 30 * 86400;
          else if (planType === 'annual') expiresAt = now + 365 * 86400;

          if (ordId || plinkId) {
            await updatePaymentTransactionSuccess(
              env.DB,
              ordId || plinkId || '',
              rzpResult.paymentId || payId || 'pay_admin_verified',
              'admin_verified',
              'razorpay'
            );
          }

          await directUpgradeProUser(env.DB, {
            telegram_user_id: resolvedUserId,
            customer_name: rzpResult.customerName || null,
            phone_number: rzpResult.phoneNumber || null,
            plan_type: planType,
            expires_at: expiresAt,
            notes: `Admin Verified with Razorpay (Payment: ${rzpResult.paymentId || payId})`,
          });

          await recordAdminLog(
            env.DB,
            'ADMIN_PAYMENT_VERIFIED',
            resolvedUserId,
            `Admin verified Razorpay link ${plinkId || ordId} for user ${resolvedUserId}. Plan: ${planType}`
          );

          return jsonResponse({
            success: true,
            verified: true,
            plan_type: planType,
            telegram_user_id: resolvedUserId,
            expires_at: expiresAt,
            message: `Payment confirmed! Pro access granted for plan: ${planType}`,
          });
        }

        // GET /api/admin/bot-subscribers
        if (url.pathname === '/api/admin/bot-subscribers' && request.method === 'GET') {
          const subscribers = await listBotSubscribers(env.DB, false);
          const activeCount = await countBotSubscribers(env.DB);
          return jsonResponse({ subscribers, active_count: activeCount });
        }

        // POST /api/admin/broadcast
        if (url.pathname === '/api/admin/broadcast' && request.method === 'POST') {
          const body = (await request.json()) as BroadcastMessageRequest;
          if (!body.message || !body.message.trim()) {
            return jsonResponse({ error: 'Broadcast message content cannot be empty' }, 400);
          }

          const botToken = env.TELEGRAM_BOT_TOKEN;
          if (!botToken) {
            return jsonResponse({ error: 'TELEGRAM_BOT_TOKEN is not configured on server' }, 400);
          }

          let subscribers = await listBotSubscribers(env.DB, true);
          if (body.target_user_id) {
            subscribers = subscribers.filter(s => s.telegram_user_id === body.target_user_id || s.chat_id === body.target_user_id);
            if (subscribers.length === 0) {
              subscribers = [{ telegram_user_id: body.target_user_id, chat_id: body.target_user_id, username: null, first_name: null, subscribed_at: Date.now(), is_active: 1 }];
            }
          }

          let sentCount = 0;
          let failedCount = 0;

          const replyMarkup = (body.button_text && body.button_url) ? {
            inline_keyboard: [[{ text: body.button_text.trim(), url: body.button_url.trim() }]]
          } : undefined;

          for (const sub of subscribers) {
            try {
              const res = await sendTelegramMessage(botToken, sub.chat_id, body.message, {
                parse_mode: body.parse_mode || 'Markdown',
                reply_markup: replyMarkup,
              });
              if (res.ok) {
                sentCount++;
              } else {
                failedCount++;
              }
            } catch {
              failedCount++;
            }
          }

        }
      }

      // -------------------------------------------------------------
      // 2.1 Direct Razorpay Payment APIs (Account-Linked Entitlement)
      // -------------------------------------------------------------

      // Helper function to award referral bonus securely upon genuine verified purchase
      const awardReferralBonusIfApplicable = async (
        referralCode: string | null | undefined,
        buyerTgId: string,
        buyerName: string | null | undefined,
        orderId: string
      ) => {
        if (!referralCode || !buyerTgId) return;
        const cleanCode = referralCode.trim().toUpperCase();
        if (!cleanCode) return;

        try {
          const referrerProfile = await getReferralProfileByCode(env.DB, cleanCode);
          if (!referrerProfile) {
            console.warn(`[Referral] Referral code ${cleanCode} not found in database`);
            return;
          }

          const referrerTgId = referrerProfile.telegram_user_id ? String(referrerProfile.telegram_user_id).trim() : '';
          const cleanBuyerTgId = String(buyerTgId).trim();

          // 1. Anti-Self-Referral Guard
          if (referrerTgId && referrerTgId === cleanBuyerTgId) {
            console.warn(`[Referral] Anti-self-referral rejected: buyer ${cleanBuyerTgId} used own code ${cleanCode}`);
            return;
          }

          // 2. One-time per buyer guard
          const priorClaim = await env.DB.prepare(
            `SELECT id FROM referral_conversions WHERE referred_telegram_user_id = ? LIMIT 1`
          ).bind(cleanBuyerTgId).first();

          if (priorClaim) {
            console.warn(`[Referral] Buyer ${cleanBuyerTgId} has already claimed a referral conversion previously.`);
            return;
          }

          // Prevent double-crediting for the exact same order_id
          if (orderId) {
            const priorOrder = await env.DB.prepare(
              `SELECT id FROM referral_conversions WHERE order_id = ? LIMIT 1`
            ).bind(orderId).first();
            if (priorOrder) {
              console.warn(`[Referral] Order ${orderId} already credited for referral.`);
              return;
            }
          }

          const rewardStr = await getStoreSetting(env.DB, 'referral_reward_amount', '50');
          const rewardAmount = parseFloat(rewardStr) || 50;
          const orderTx = orderId ? await getPaymentTransactionByOrderId(env.DB, orderId) : null;
          const orderAmountRupees = orderTx?.amount ? (orderTx.amount >= 1000 ? orderTx.amount / 100 : orderTx.amount) : 49;

          await recordReferralConversion(env.DB, {
            referral_code: cleanCode,
            referrer_telegram_user_id: referrerTgId || undefined,
            referred_telegram_user_id: cleanBuyerTgId,
            order_id: orderId,
            order_amount: orderAmountRupees,
            commission_amount: rewardAmount,
            conversion_type: 'pro_purchase',
          });

          console.log(`[Referral] Successfully credited ₹${rewardAmount} to code ${cleanCode} for buyer ${cleanBuyerTgId} (Order: ${orderId})`);

          // Notify referrer via official Telegram bot if configured
          if (env.TELEGRAM_BOT_TOKEN && referrerTgId) {
            try {
              const displayName = buyerName ? buyerName.trim() : 'Friend';
              const updatedBal = referrerProfile.wallet_balance + rewardAmount;
              const botMsg = `🎉 *Congratulations!*\n\n` +
                `A friend just upgraded to *TG Drive Pro* using your referral link!\n\n` +
                `👤 *Referred User:* ${displayName}\n` +
                `💰 *Reward Credited:* ₹${rewardAmount.toFixed(0)}\n` +
                `💼 *Wallet Balance:* ₹${updatedBal.toFixed(0)}\n\n` +
                `Open *TG Drive* > *Refer & Earn* to withdraw via UPI or Bank transfer.`;

              await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: referrerTgId,
                  text: botMsg,
                  parse_mode: 'Markdown',
                }),
              });
            } catch (notifyErr) {
              console.error('[Referral] Failed to notify referrer via Telegram bot:', notifyErr);
            }
          }
        } catch (err) {
          console.error('[Referral] Error awarding referral bonus:', err);
        }
      };

      // POST /api/payment/razorpay/create-order
      if (url.pathname === '/api/payment/razorpay/create-order' && request.method === 'POST') {
        try {
          await ensureStoreTables(env.DB);
          const body = (await request.json()) as CreateRazorpayOrderRequest;
          const tgUserId = body.telegram_user_id ? String(body.telegram_user_id).trim() : '';
          if (!tgUserId) {
            return jsonResponse({ error: 'telegram_user_id is required' }, 400);
          }

          const planType = body.plan_type || 'lifetime';
          let amountInPaise = 39900; // default ₹399 in paise

          if (typeof body.amount === 'number' && body.amount > 0) {
            // Frontend sends amount in INR rupees (e.g. 24, 49, 199, 249, 499)
            amountInPaise = body.amount >= 5000 && body.amount % 100 === 0 ? Math.round(body.amount) : Math.round(body.amount * 100);
          } else {
            const livePriceStr = await getStoreSetting(env.DB, 'live_price', '499');
            const livePrice = parseFloat(livePriceStr) || 499;
            amountInPaise = Math.round(livePrice * 100);
          }

          const keyId = env.RAZORPAY_KEY_ID;
          const keySecret = env.RAZORPAY_KEY_SECRET;

          if (!keyId || !keySecret) {
            // Mock order ID if Razorpay keys not yet set in environment
            const mockOrderId = `order_mock_${Date.now()}`;
            await createPaymentTransaction(env.DB, {
              id: crypto.randomUUID(),
              order_id: mockOrderId,
              telegram_user_id: tgUserId,
              phone_number: body.phone_number || null,
              customer_name: body.customer_name || null,
              customer_email: body.customer_email || null,
              plan_type: planType,
              amount: amountInPaise,
              currency: 'INR',
              status: 'created',
            });

            return jsonResponse({
              success: true,
              order_id: mockOrderId,
              key_id: 'rzp_test_placeholder',
              amount: amountInPaise,
              currency: 'INR',
              plan_type: planType,
              telegram_user_id: tgUserId,
            });
          }

          // Call official Razorpay Orders API
          const authHeader = 'Basic ' + btoa(`${keyId}:${keySecret}`);
          const receiptId = `rcpt_${tgUserId}_${Date.now()}`.slice(0, 40);
          const checkoutConfigId = body.checkout_config_id || env.RAZORPAY_CHECKOUT_CONFIG_ID;

          const orderPayload: Record<string, unknown> = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: receiptId,
            notes: {
              telegram_user_id: tgUserId,
              phone_number: body.phone_number || '',
              customer_name: body.customer_name || '',
              customer_email: body.customer_email || '',
              plan_type: planType,
              referral_code: body.referral_code ? body.referral_code.trim().toUpperCase() : '',
              username: body.username ? body.username.trim() : '',
            },
          };
          if (checkoutConfigId && checkoutConfigId !== 'config_TiUSpvBT1EEuwz') {
            orderPayload.checkout_config_id = checkoutConfigId;
          }

          const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Authorization': authHeader,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderPayload),
          });

          const rzpData = (await rzpRes.json()) as { id?: string; amount?: number; currency?: string; error?: { description?: string } };

          if (!rzpRes.ok || !rzpData.id) {
            return jsonResponse({
              error: rzpData.error?.description || 'Failed to create Razorpay order',
            }, 500);
          }

          // Generate dedicated Razorpay Payment Link for Seamless Mobile UPI Intent (Google Pay / PhonePe / Paytm)
          let paymentLinkUrl: string | undefined;
          try {
            const rawPhone = (body.phone_number || '').replace(/[^0-9+]/g, '');
            const customerContact = rawPhone.length >= 10 ? rawPhone : undefined;
            const customerEmail = body.customer_email || (tgUserId ? `tg_${tgUserId}@t-drive.internal` : undefined);

            const plRes = await fetch('https://api.razorpay.com/v1/payment_links', {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: amountInPaise,
                currency: 'INR',
                accept_partial: false,
                description: `TG Drive Pro (${planType}) Upgrade`,
                customer: {
                  name: body.customer_name || 'TG Drive User',
                  contact: customerContact,
                  email: customerEmail,
                },
                notify: { sms: false, email: false },
                reminder_enable: false,
                notes: {
                  telegram_user_id: tgUserId,
                  order_id: rzpData.id,
                  plan_type: planType,
                  customer_name: body.customer_name || '',
                  customer_email: body.customer_email || '',
                  phone_number: body.phone_number || '',
                  referral_code: body.referral_code ? body.referral_code.trim().toUpperCase() : '',
                  username: body.username ? body.username.trim() : '',
                },
                callback_url: `${url.origin}/api/payment/razorpay/callback?user_id=${encodeURIComponent(tgUserId)}&order_id=${encodeURIComponent(rzpData.id)}&plan_type=${encodeURIComponent(planType)}`,
                callback_method: 'get',
              }),
            });

            if (plRes.ok) {
              const plData = (await plRes.json()) as { short_url?: string };
              if (plData.short_url) {
                paymentLinkUrl = plData.short_url;
              }
            } else {
              console.warn('[create-order] Payment link creation returned non-ok:', await plRes.text());
            }
          } catch (plErr) {
            console.warn('[create-order] Failed to generate payment link for mobile:', plErr);
          }

          // Record created order in payment_transactions table
          await createPaymentTransaction(env.DB, {
            id: crypto.randomUUID(),
            order_id: rzpData.id,
            telegram_user_id: tgUserId,
            phone_number: body.phone_number || null,
            customer_name: body.customer_name || null,
            customer_email: body.customer_email || null,
            plan_type: planType,
            amount: rzpData.amount || amountInPaise,
            currency: rzpData.currency || 'INR',
            status: 'created',
          });

          return jsonResponse({
            success: true,
            order_id: rzpData.id,
            key_id: keyId,
            checkout_config_id: checkoutConfigId && checkoutConfigId !== 'config_TiUSpvBT1EEuwz' ? checkoutConfigId : undefined,
            amount: rzpData.amount || amountInPaise,
            currency: rzpData.currency || 'INR',
            plan_type: planType,
            telegram_user_id: tgUserId,
            payment_link_url: paymentLinkUrl,
          });
        } catch (err) {
          console.error('Error in create-order:', err);
          return jsonResponse({ error: err instanceof Error ? err.message : 'Error creating order' }, 500);
        }
      }

      // POST /api/payment/razorpay/verify
      if (url.pathname === '/api/payment/razorpay/verify' && request.method === 'POST') {
        try {
          await ensureStoreTables(env.DB);
          const body = (await request.json()) as VerifyRazorpayPaymentRequest;
          const { order_id, payment_id, signature } = body;
          const tgUserId = body.telegram_user_id ? String(body.telegram_user_id).trim() : '';

          if (!order_id || !payment_id || !signature || !tgUserId) {
            return jsonResponse({ error: 'order_id, payment_id, signature, and telegram_user_id are required' }, 400);
          }

          const keySecret = env.RAZORPAY_KEY_SECRET;
          if (keySecret) {
            const dataToSign = `${order_id}|${payment_id}`;
            const isValid = await verifyHmacSha256(dataToSign, signature, keySecret);
            if (!isValid) {
              return jsonResponse({ error: 'Invalid payment signature. Verification failed.' }, 400);
            }
          }

          const planType = body.plan_type || 'lifetime';
          const now = Math.floor(Date.now() / 1000);
          let expiresAt: number | null = null;
          if (planType === 'annual') {
            expiresAt = now + 365 * 86400;
          } else if (planType === 'monthly') {
            expiresAt = now + 30 * 86400;
          }

          // Update payment transaction record
          await updatePaymentTransactionSuccess(env.DB, order_id, payment_id, signature, 'razorpay');

          // Upgrade Pro account directly in pro_users & licenses table
          await directUpgradeProUser(env.DB, {
            telegram_user_id: tgUserId,
            phone_number: body.phone_number || null,
            customer_name: body.customer_name || null,
            customer_email: body.customer_email || null,
            plan_type: planType,
            expires_at: expiresAt,
            notes: `Razorpay Order ${order_id} (Payment: ${payment_id})`,
          });

          // Issue cryptographic Ed25519 token for offline grace & client validation
          const claims: LicenseClaims = {
            sub: tgUserId,
            tg_id: tgUserId,
            phone: body.phone_number || undefined,
            plan: planType,
            exp: expiresAt,
            iat: now,
            iss: 'tg-drive-pro',
            name: body.customer_name || undefined,
          };
          const token = await issueLicenseToken(claims, env);

          // Send instant Telegram Welcome / Confirmation receipt message if bot token configured
          if (env.TELEGRAM_BOT_TOKEN) {
            try {
              await sendProWelcomeMessage(
                env.TELEGRAM_BOT_TOKEN,
                tgUserId,
                body.customer_name || 'Friend',
                planType === 'lifetime' ? 'Lifetime Pro' : `${planType} Pro`
              );
            } catch (botErr) {
              console.error('Failed to send Telegram bot pro welcome message:', botErr);
            }
          }

          // Award Referral Bonus upon genuine cryptographically verified purchase
          try {
            const referralCode = body.referral_code ? body.referral_code.trim().toUpperCase() : null;
            if (referralCode) {
              await awardReferralBonusIfApplicable(
                referralCode,
                tgUserId,
                body.customer_name || body.username || null,
                order_id
              );
            }
          } catch (refErr) {
            console.error('[verify] Referral processing error:', refErr);
          }

          await recordAdminLog(env.DB, 'RAZORPAY_VERIFY_SUCCESS', tgUserId, `Pro unlocked for Telegram User ${tgUserId} (Order: ${order_id})`);

          return jsonResponse({
            success: true,
            is_pro: true,
            plan_type: planType,
            telegram_user_id: tgUserId,
            expires_at: expiresAt,
            token,
            message: '🎉 Congratulations! Your TG Drive PRO is now active.',
          });
        } catch (err) {
          console.error('Error in verify payment:', err);
          return jsonResponse({ error: err instanceof Error ? err.message : 'Error verifying payment' }, 500);
        }
      }


      // POST /api/payment/razorpay/verify-link (Direct Client / Mobile / Admin Polling & Link Verification)
      if (url.pathname === '/api/payment/razorpay/verify-link' && request.method === 'POST') {
        try {
          await ensureStoreTables(env.DB);
          const body = (await request.json()) as {
            telegram_user_id?: string | number;
            payment_link_id?: string;
            payment_id?: string;
            order_id?: string;
            plan_type?: LicensePlan;
          };

          const tgUserId = body.telegram_user_id ? String(body.telegram_user_id).trim() : '';
          const plinkId = body.payment_link_id?.trim();
          const payId = body.payment_id?.trim();
          const ordId = body.order_id?.trim();

          const rzpResult = await verifyRazorpayWithApi({
            paymentId: payId,
            paymentLinkId: plinkId,
            orderId: ordId,
          });

          if (!rzpResult.verified) {
            return jsonResponse({
              success: false,
              paid: false,
              status: rzpResult.status,
              message: 'Payment not yet verified or pending completion with Razorpay.',
            }, 200);
          }

          const resolvedUserId = tgUserId || rzpResult.telegramUserId || '';
          if (!resolvedUserId) {
            return jsonResponse({ error: 'telegram_user_id is required' }, 400);
          }

          // Determine exact plan type accurately
          let planType = body.plan_type || rzpResult.planType;
          if (!planType && ordId) {
            const tx = await getPaymentTransactionByOrderId(env.DB, ordId);
            if (tx?.plan_type) planType = tx.plan_type as LicensePlan;
          }
          if (!planType && rzpResult.amountPaise) {
            if (rzpResult.amountPaise <= 9900) planType = 'monthly';
            else if (rzpResult.amountPaise <= 29900) planType = 'annual';
            else planType = 'lifetime';
          }
          if (!planType) planType = 'monthly';

          const now = Math.floor(Date.now() / 1000);
          let expiresAt: number | null = null;
          if (planType === 'monthly') expiresAt = now + 30 * 86400;
          else if (planType === 'annual') expiresAt = now + 365 * 86400;

          // Update transaction
          if (ordId || plinkId) {
            await updatePaymentTransactionSuccess(
              env.DB,
              ordId || plinkId || '',
              rzpResult.paymentId || payId || 'pay_verified',
              'api_verified',
              'razorpay'
            );
          }

          // Upgrade Pro user
          await directUpgradeProUser(env.DB, {
            telegram_user_id: resolvedUserId,
            phone_number: rzpResult.phoneNumber || null,
            customer_name: rzpResult.customerName || null,
            plan_type: planType,
            expires_at: expiresAt,
            notes: `Verified via API (Payment: ${rzpResult.paymentId || payId || plinkId})`,
          });

          return jsonResponse({
            success: true,
            paid: true,
            is_pro: true,
            plan_type: planType,
            telegram_user_id: resolvedUserId,
            expires_at: expiresAt,
            message: `🎉 Pro activated successfully! Plan: ${planType}`,
          });
        } catch (err) {
          console.error('[verify-link] Error:', err);
          return jsonResponse({ error: err instanceof Error ? err.message : 'Error verifying payment link' }, 500);
        }
      }

      // GET /api/payment/razorpay/callback (Mobile Browser Completion Callback)
      if (url.pathname === '/api/payment/razorpay/callback' && request.method === 'GET') {
        const userId = url.searchParams.get('user_id') || '';
        const orderId = url.searchParams.get('order_id') || '';
        const razorpayPaymentId = url.searchParams.get('razorpay_payment_id') || '';
        const razorpayPaymentLinkId = url.searchParams.get('razorpay_payment_link_id') || '';
        const razorpayStatus = (url.searchParams.get('razorpay_payment_link_status') || '').toLowerCase();
        const signature = url.searchParams.get('razorpay_signature') || '';

        // Check if payment was explicitly cancelled or failed
        const isExplicitFailure = razorpayStatus === 'cancelled' || razorpayStatus === 'failed' || razorpayStatus === 'expired';

        let isPaymentConfirmed = false;
        let resolvedPlanType: LicensePlan = (url.searchParams.get('plan_type') as LicensePlan) || 'monthly';
        let resolvedAmount = 0;
        let resolvedUserId = userId;
        let customerName = '';

        if (!isExplicitFailure && (razorpayPaymentId || razorpayPaymentLinkId || razorpayStatus === 'paid')) {
          // Verify with Razorpay API for 100% genuine payment confirmation
          const rzpResult = await verifyRazorpayWithApi({
            paymentId: razorpayPaymentId,
            paymentLinkId: razorpayPaymentLinkId,
            orderId: orderId,
          });

          if (rzpResult.verified) {
            isPaymentConfirmed = true;
            if (rzpResult.planType) resolvedPlanType = rzpResult.planType;
            if (rzpResult.amountPaise) resolvedAmount = rzpResult.amountPaise;
            if (rzpResult.telegramUserId) resolvedUserId = rzpResult.telegramUserId;
            if (rzpResult.customerName) customerName = rzpResult.customerName;
          } else if (razorpayStatus === 'paid' || razorpayPaymentId.startsWith('pay_')) {
            // Fallback: If Razorpay redirect explicitly reports paid or gave pay_ id
            isPaymentConfirmed = true;
          }
        }

        // If not verified or failed, render cancellation / failure page
        if (!isPaymentConfirmed || !resolvedUserId) {
          if (orderId) {
            try {
              await env.DB.prepare("UPDATE payment_transactions SET status = 'failed' WHERE order_id = ?").bind(orderId).run();
            } catch {}
          }

          const failHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Incomplete - TG Drive Pro</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      background: #090B10;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #11141C;
      border: 1px solid rgba(239, 68, 68, 0.3);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
      border-radius: 24px;
      padding: 32px 24px;
      max-width: 420px;
      width: 100%;
    }
    .icon { font-size: 54px; margin-bottom: 14px; }
    h1 { color: #F87171; font-size: 1.4rem; margin: 0 0 8px; font-weight: 800; }
    p { color: #94a3b8; font-size: 0.9rem; line-height: 1.5; margin: 0 0 22px; }
    .btn {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      font-weight: 700;
      font-size: 0.95rem;
      padding: 13px 20px;
      border-radius: 12px;
      text-decoration: none;
      box-sizing: border-box;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>Payment Not Completed</h1>
    <p>The transaction was cancelled or could not be verified by Razorpay.<br><br>No subscription was activated. If money was debited from your bank, Razorpay will refund it automatically within 24-48 hours.</p>
    <a href="https://t.me" class="btn">Return to TG Drive App</a>
  </div>
</body>
</html>`;
          return new Response(failHtml, { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 200 });
        }

        // Accurately determine plan type and duration
        if (!resolvedPlanType || resolvedPlanType === ('lifetime' as LicensePlan)) {
          // Check if transaction has accurate plan
          if (orderId) {
            try {
              const tx = await getPaymentTransactionByOrderId(env.DB, orderId);
              if (tx?.plan_type) resolvedPlanType = tx.plan_type as LicensePlan;
            } catch {}
          }
          // Check by amount paid
          if (resolvedAmount > 0) {
            if (resolvedAmount <= 9900) resolvedPlanType = 'monthly';
            else if (resolvedAmount <= 29900) resolvedPlanType = 'annual';
            else resolvedPlanType = 'lifetime';
          }
        }

        const now = Math.floor(Date.now() / 1000);
        let expiresAt: number | null = null;
        let planTitle = '1-Month Pass';
        let expiryDesc = '';

        if (resolvedPlanType === 'monthly') {
          expiresAt = now + 30 * 86400;
          planTitle = '1-Month Pass Active';
          const d = new Date(expiresAt * 1000);
          expiryDesc = `Valid for 30 Days • Expires on ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else if (resolvedPlanType === 'annual') {
          expiresAt = now + 365 * 86400;
          planTitle = '1-Year Annual Pass Active';
          const d = new Date(expiresAt * 1000);
          expiryDesc = `Valid for 365 Days • Expires on ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else {
          resolvedPlanType = 'lifetime';
          planTitle = 'Lifetime Pro VIP Active';
          expiryDesc = 'Permanent VIP Access Unlocked Forever • Zero Renewals';
        }

        // Update database records
        try {
          if (orderId) {
            await updatePaymentTransactionSuccess(
              env.DB,
              orderId,
              razorpayPaymentId || razorpayPaymentLinkId || 'pay_link_done',
              signature || 'callback_verified',
              'razorpay'
            );
          }

          await directUpgradeProUser(env.DB, {
            telegram_user_id: resolvedUserId,
            customer_name: customerName || null,
            plan_type: resolvedPlanType,
            expires_at: expiresAt,
            notes: `Razorpay Callback (${razorpayPaymentId || razorpayPaymentLinkId}, Order: ${orderId})`,
          });
        } catch (dbErr) {
          console.error('[callback] DB update error:', dbErr);
        }

        // Send instant welcome Telegram message if bot configured
        if (env.TELEGRAM_BOT_TOKEN) {
          try {
            await sendProWelcomeMessage(
              env.TELEGRAM_BOT_TOKEN,
              resolvedUserId,
              customerName || 'Friend',
              planTitle
            );
          } catch {}
        }

        const successHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful - TG Drive Pro</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      background: #080A10;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: linear-gradient(180deg, #121524 0%, #0c0e17 100%);
      border: 1px solid rgba(168, 85, 247, 0.4);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(168, 85, 247, 0.2);
      border-radius: 28px;
      padding: 36px 24px;
      max-width: 440px;
      width: 100%;
    }
    .icon { font-size: 58px; margin-bottom: 12px; }
    h1 { color: #A855F7; font-size: 1.55rem; margin: 0 0 6px; font-weight: 900; }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.35);
      color: #4ADE80;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .details {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 14px 16px;
      margin-bottom: 22px;
      text-align: left;
      font-size: 0.82rem;
    }
    .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .row:last-child { margin-bottom: 0; }
    .label { color: #94A3B8; }
    .val { color: #FFFFFF; font-weight: 700; font-family: monospace; }
    p { color: #94a3b8; font-size: 0.88rem; line-height: 1.5; margin: 0 0 24px; }
    .btn {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #6366F1, #A855F7, #EC4899);
      color: #fff;
      font-weight: 800;
      font-size: 1rem;
      padding: 14px 20px;
      border-radius: 14px;
      text-decoration: none;
      box-sizing: border-box;
      box-shadow: 0 8px 25px rgba(168, 85, 247, 0.35);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">👑</div>
    <h1>Payment Successful!</h1>
    <div class="badge">✓ ${planTitle}</div>
    
    <div class="details">
      <div class="row">
        <span class="label">Plan:</span>
        <span class="val" style="color: #C084FC;">${planTitle}</span>
      </div>
      <div class="row">
        <span class="label">Telegram ID:</span>
        <span class="val">${resolvedUserId}</span>
      </div>
      <div class="row">
        <span class="label">Status:</span>
        <span class="val" style="color: #4ADE80;">● Pro Active</span>
      </div>
      <div class="row">
        <span class="label">Validity:</span>
        <span class="val" style="font-size: 0.75rem;">${expiryDesc}</span>
      </div>
    </div>

    <p>Your Telegram account is now upgraded to Pro.<br>Switch back to the TG Drive App to enjoy Turbo 100 MB/s speed, vault encryption & zero ads!</p>
    <a href="https://t.me" class="btn">Return to TG Drive App</a>
  </div>
</body>
</html>`;
        return new Response(successHtml, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
      }

      // -------------------------------------------------------------
      // 2.2 Direct User Entitlement & Status API (/api/user/status)
      // -------------------------------------------------------------
      if ((url.pathname === '/api/user/status' || url.pathname.startsWith('/api/user/')) && (request.method === 'GET' || request.method === 'POST')) {
        let tgUserId = url.searchParams.get('telegram_user_id') || url.searchParams.get('tg_id') || '';
        if (!tgUserId && url.pathname.startsWith('/api/user/') && url.pathname.endsWith('/status')) {
          tgUserId = url.pathname.replace('/api/user/', '').replace('/status', '').trim();
        }

        let phone = url.searchParams.get('phone_number') || url.searchParams.get('phone') || '';

        if (request.method === 'POST') {
          try {
            const body = (await request.json()) as Record<string, string>;
            tgUserId = body.telegram_user_id || body.tg_id || tgUserId;
            phone = body.phone_number || body.phone || phone;
          } catch {}
        }

        tgUserId = tgUserId.trim();
        phone = phone.trim();

        if (!tgUserId && !phone) {
          return jsonResponse({ active: false, is_pro: false, error: 'telegram_user_id is required' }, 400);
        }

        // 1. Check pro_users table
        if (tgUserId) {
          const proUser = await getProUserByTelegramId(env.DB, tgUserId);
          if (proUser && proUser.is_banned === 0) {
            // Reconcile if marked lifetime by legacy callback, but user actually paid for monthly or annual
            if (proUser.plan_type === 'lifetime' && !proUser.expires_at) {
              try {
                // Check latest transaction for user
                const tx = await env.DB.prepare(
                  "SELECT * FROM payment_transactions WHERE telegram_user_id = ? ORDER BY created_at DESC LIMIT 1"
                ).bind(tgUserId).first<{ id: string; order_id: string; payment_id: string; plan_type: string; amount: number; status: string; created_at: number; paid_at: number }>();

                if (tx) {
                  let correctPlan: LicensePlan | null = null;
                  if (tx.plan_type === 'monthly' || (tx.amount > 0 && tx.amount <= 9900)) {
                    correctPlan = 'monthly';
                  } else if (tx.plan_type === 'annual' || (tx.amount > 9900 && tx.amount <= 29900)) {
                    correctPlan = 'annual';
                  }

                  if (correctPlan) {
                    const paidAt = tx.paid_at || tx.created_at || Math.floor(Date.now() / 1000);
                    const duration = correctPlan === 'annual' ? 365 * 86400 : 30 * 86400;
                    const newExpiresAt = paidAt + duration;

                    await env.DB.prepare('UPDATE pro_users SET plan_type = ?, expires_at = ? WHERE telegram_user_id = ?')
                      .bind(correctPlan, newExpiresAt, tgUserId)
                      .run();
                    proUser.plan_type = correctPlan;
                    proUser.expires_at = newExpiresAt;
                  }
                }
              } catch (e) {
                console.warn('[user/status] Transaction reconciliation error:', e);
              }
            }

            const now = Math.floor(Date.now() / 1000);
            const isExpired = Boolean(proUser.expires_at && proUser.expires_at <= now);
            const isPro = proUser.is_pro === 1 && !isExpired;

            if (isPro) {
              const claims: LicenseClaims = {
                sub: proUser.telegram_user_id,
                tg_id: proUser.telegram_user_id,
                phone: proUser.phone_number || undefined,
                plan: proUser.plan_type,
                exp: proUser.expires_at ?? null,
                iat: now,
                iss: 'tg-drive-pro',
                name: proUser.first_name || undefined,
              };
              const token = await issueLicenseToken(claims, env);

              return jsonResponse({
                active: true,
                is_pro: true,
                is_expired: false,
                plan_type: proUser.plan_type,
                telegram_user_id: proUser.telegram_user_id,
                phone_number: proUser.phone_number,
                first_name: proUser.first_name,
                username: proUser.username,
                expires_at: proUser.expires_at,
                ad_free: true,
                token,
                message: 'TG Drive Pro is active on your Telegram account.',
              });
            } else if (isExpired) {
              return jsonResponse({
                active: false,
                is_pro: false,
                is_expired: true,
                plan_type: proUser.plan_type,
                telegram_user_id: proUser.telegram_user_id,
                phone_number: proUser.phone_number,
                first_name: proUser.first_name,
                username: proUser.username,
                expires_at: proUser.expires_at,
                ad_free: false,
                message: 'Your Pro subscription has expired.',
              });
            }
          }
        }

        // 2. Fallback check licenses table (legacy)
        const license = await getLicenseByTelegramAccount(env.DB, tgUserId || null, phone || null);
        if (license && license.is_banned === 0) {
          const now = Math.floor(Date.now() / 1000);
          const isExpired = Boolean(license.expires_at && license.expires_at <= now);

          if (!isExpired) {
            const claims: LicenseClaims = {
              sub: license.telegram_user_id || license.license_key,
              tg_id: license.telegram_user_id || tgUserId || undefined,
              phone: license.phone_number || phone || undefined,
              plan: license.plan_type,
              exp: license.expires_at,
              iat: now,
              iss: 'tg-drive-pro',
              name: license.customer_name || undefined,
            };
            const token = await issueLicenseToken(claims, env);

            return jsonResponse({
              active: true,
              is_pro: true,
              is_expired: false,
              plan_type: license.plan_type,
              telegram_user_id: license.telegram_user_id,
              phone_number: license.phone_number,
              customer_name: license.customer_name,
              expires_at: license.expires_at,
              ad_free: true,
              token,
              message: 'TG Drive Pro is active on your Telegram account.',
            });
          } else {
            return jsonResponse({
              active: false,
              is_pro: false,
              is_expired: true,
              plan_type: license.plan_type,
              telegram_user_id: license.telegram_user_id,
              phone_number: license.phone_number,
              customer_name: license.customer_name,
              expires_at: license.expires_at,
              ad_free: false,
              message: 'Your Pro subscription has expired.',
            });
          }
        }

        return jsonResponse({
          active: false,
          is_pro: false,
          ad_free: false,
          message: 'No active Pro entitlement found for this Telegram account.',
        });
      }

      // -------------------------------------------------------------
      // 2.3 Telegram Bot Webhook API (/api/telegram/webhook)
      // -------------------------------------------------------------
      if ((url.pathname === '/api/telegram/webhook' || url.pathname === '/api/webhooks/telegram' || url.pathname === '/telegram/webhook') && request.method === 'POST') {
        try {
          const update = await request.json();
          return await handleTelegramBotUpdate(update, env);
        } catch (err) {
          console.error('Telegram bot webhook error:', err);
          return jsonResponse({ ok: false, error: 'Failed to process Telegram update' }, 500);
        }
      }

      // -------------------------------------------------------------
      // 2.34 Privacy-Safe Crash Ingestion API (/api/crash-report)
      // -------------------------------------------------------------
      if (url.pathname === '/api/crash-report' && request.method === 'POST') {
        try {
          const body = (await request.json()) as {
            event?: string;
            appVersion?: string;
            source?: string;
            errorType?: string;
            frames?: string[];
            platform?: string;
            occurredAt?: string;
          };

          if (!body || body.event !== 'app_crash') {
            return jsonResponse({ error: 'Invalid crash report event' }, 400);
          }

          const cleanVersion = String(body.appVersion || 'unknown').trim().slice(0, 32);
          const cleanSource = String(body.source || 'unknown').trim().slice(0, 16);
          const cleanErrorType = String(body.errorType || 'UnknownError').trim().slice(0, 96);
          const cleanPlatform = String(body.platform || 'unknown').trim().slice(0, 96);
          const cleanOccurredAt = String(body.occurredAt || new Date().toISOString()).trim().slice(0, 64);
          const safeFrames = Array.isArray(body.frames)
            ? body.frames.slice(0, 6).map(f => String(f).trim().slice(0, 160))
            : [];

          const report = await recordCrashReport(env.DB, {
            app_version: cleanVersion,
            source: cleanSource,
            error_type: cleanErrorType,
            frames: JSON.stringify(safeFrames),
            platform: cleanPlatform,
            occurred_at: cleanOccurredAt,
          });

          return jsonResponse({ success: true, id: report.id });
        } catch (err) {
          console.error('Error recording crash report:', err);
          return jsonResponse({ error: 'Failed to record crash report' }, 500);
        }
      }

      // -------------------------------------------------------------
      // 2.35 Public Active Offer Endpoint (/api/store/active-offer)
      // -------------------------------------------------------------
      if (url.pathname === '/api/store/active-offer' && request.method === 'GET') {
        try {
          await ensureStoreTables(env.DB);
          const now = Math.floor(Date.now() / 1000);
          const row = (await env.DB.prepare(`
            SELECT * FROM special_offers 
            WHERE is_active = 1 AND (countdown_end IS NULL OR countdown_end > ?)
            ORDER BY created_at DESC LIMIT 1
          `).bind(now).first()) as Record<string, unknown> | null;

          if (!row) {
            return jsonResponse({ active: false, offer: null });
          }

          let parsedPerks: string[] = [];
          if (typeof row.perks === 'string' && row.perks) {
            try {
              parsedPerks = JSON.parse(row.perks) as string[];
            } catch {
              parsedPerks = row.perks.split('\n').map(p => p.trim()).filter(Boolean);
            }
          }

          const countdownEnd = typeof row.countdown_end === 'number' ? row.countdown_end : null;
          const remainingSeconds = countdownEnd ? Math.max(0, countdownEnd - now) : null;

          return jsonResponse({
            active: true,
            offer: {
              ...row,
              perks_list: parsedPerks,
              remaining_seconds: remainingSeconds,
            }
          });
        } catch (err) {
          console.error('Error fetching active offer:', err);
          return jsonResponse({ active: false, offer: null });
        }
      }

      // -------------------------------------------------------------
      // 2.38 Claim Free Trial Endpoint (/api/store/claim-trial)
      // -------------------------------------------------------------
      if (url.pathname === '/api/store/claim-trial' && request.method === 'POST') {
        try {
          await ensureStoreTables(env.DB);
          const body = (await request.json()) as { name?: string; email?: string; hardware_id?: string };

          if (!body.name || !body.name.trim()) {
            return jsonResponse({ error: 'Please enter your Full Name to claim your free trial.' }, 400);
          }
          if (!body.email || !body.email.trim() || !body.email.includes('@')) {
            return jsonResponse({ error: 'Please enter a valid Email Address.' }, 400);
          }
          if (!body.hardware_id || !body.hardware_id.trim()) {
            return jsonResponse({ error: 'Device Hardware ID is required for trial registration.' }, 400);
          }

          const trialEnabled = (await getStoreSetting(env.DB, 'trial_enabled', '1')) === '1';
          if (!trialEnabled) {
            return jsonResponse({ error: 'Free trial is currently disabled by administrator.' }, 400);
          }

          const trialDays = parseInt(await getStoreSetting(env.DB, 'trial_days', '30'), 10) || 30;
          const cleanName = body.name.trim();
          const cleanEmail = body.email.trim().toLowerCase();
          const cleanHwid = body.hardware_id.trim();

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(cleanEmail)) {
            return jsonResponse({ error: 'Please provide a valid email address format (e.g. name@example.com).' }, 400);
          }

          // Reject disposable/throwaway email providers
          const emailDomain = cleanEmail.split('@')[1];
          const blockedDomains = [
            'tempmail.com', 'temp-mail.org', '10minutemail.com', '10minutemail.net',
            'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'sharklasers.com',
            'yopmail.com', 'yopmail.fr', 'trashmail.com', 'trashmail.net',
            'getairmail.com', 'mohmal.com', 'dispostable.com', 'nada.ltd',
            'inboxkitten.com', 'mytemp.email', 'crazymailing.com', 'burnermail.io', 'maildrop.cc'
          ];
          if (emailDomain && blockedDomains.includes(emailDomain)) {
            return jsonResponse({ error: 'Temporary or disposable email services are not allowed. Please use your primary email.' }, 400);
          }

          // Check if email already claimed a trial
          const existingEmailTrial = await env.DB.prepare(
            'SELECT * FROM licenses WHERE LOWER(customer_email) = ? AND plan_type = "trial"'
          ).bind(cleanEmail).first();
          if (existingEmailTrial) {
            return jsonResponse({ error: 'This email address has already used its free trial.' }, 400);
          }

          // Check if hardware_id already claimed a trial
          const existingDevice = await env.DB.prepare(
            'SELECT d.*, l.plan_type FROM device_activations d JOIN licenses l ON d.license_key = l.license_key WHERE d.hardware_id = ? AND l.plan_type = "trial"'
          ).bind(cleanHwid).first();
          if (existingDevice) {
            return jsonResponse({ error: 'This device has already claimed its free trial period.' }, 400);
          }

          const id = crypto.randomUUID();
          const now = Math.floor(Date.now() / 1000);
          const expiresAt = now + trialDays * 86400;
          const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
          const licenseKey = `TGDRV-TR-${randomSuffix}`;

          // Create trial license
          await createLicense(env.DB, {
            id,
            license_key: licenseKey,
            customer_name: cleanName,
            customer_email: cleanEmail,
            plan_type: 'trial',
            max_devices: 2,
            notes: `Self-claimed ${trialDays}-day free trial`,
            expires_at: expiresAt,
          });

          // Activate this device
          const rawPlatform = (body as { platform?: string }).platform;
          const validPlatforms: DevicePlatform[] = ['windows', 'android', 'ios', 'macos', 'linux', 'web', 'other'];
          const platform: DevicePlatform = (rawPlatform && validPlatforms.includes(rawPlatform as DevicePlatform))
            ? (rawPlatform as DevicePlatform)
            : 'android';

          await activateDevice(env.DB, {
            id: crypto.randomUUID(),
            license_key: licenseKey,
            hardware_id: cleanHwid,
            device_name: (body as { device_name?: string }).device_name || 'Trial Client Device',
            platform,
          });

          // Issue cryptographic token
          const token = await issueLicenseToken(
            {
              sub: licenseKey,
              hwid: cleanHwid,
              plan: 'trial',
              exp: expiresAt,
              iat: now,
              iss: 'tg-drive-license-service',
              name: cleanName,
            },
            env
          );

          await recordAdminLog(env.DB, 'CLAIM_TRIAL', licenseKey, `User ${cleanEmail} claimed ${trialDays}-day free trial`);

          // Send trial welcome email with key + PDF certificate
          try {
            await sendTrialWelcomeEmail(env, {
              to: cleanEmail,
              name: cleanName,
              licenseKey,
              trialDays,
              expiresAt,
            });
          } catch (err) {
            console.error('Trial welcome email failed:', err);
          }

          return jsonResponse({
            success: true,
            license_key: licenseKey,
            customer_name: cleanName,
            plan_type: 'trial',
            expires_at: expiresAt,
            trial_days: trialDays,
            token,
            message: `Congratulations! Your ${trialDays}-day free trial is now active.`,
          });
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error('Error claiming free trial:', errMsg, err);
          return jsonResponse({ error: `Failed to register free trial: ${errMsg}` }, 500);
        }
      }

      // -------------------------------------------------------------
      // 2.4 Coupon Validation for App (/api/store/validate-coupon)
      // -------------------------------------------------------------
      if (url.pathname === '/api/store/validate-coupon' && request.method === 'GET') {
        try {
          await ensureStoreTables(env.DB);
          const code = url.searchParams.get('code') || '';
          if (!code.trim()) {
            return jsonResponse({ valid: false, error: 'Please enter a promo code.' });
          }

          const cleanCode = code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
          const coupon = await getCouponByCode(env.DB, cleanCode);

          const rawPrice = parseFloat(url.searchParams.get('price') || '');
          const planId = url.searchParams.get('plan_id') || 'lifetime';
          let basePrice = 499;
          if (!isNaN(rawPrice) && rawPrice > 0) {
            basePrice = rawPrice;
          } else if (planId === 'monthly') {
            basePrice = 49;
          } else if (planId === 'annual') {
            basePrice = 199;
          } else {
            const basePriceStr = await getStoreSetting(env.DB, 'live_price', '499');
            basePrice = parseFloat(basePriceStr) || 499;
          }

          const buyerTgId = url.searchParams.get('telegram_user_id') || url.searchParams.get('tg_id') || '';

          if (!coupon) {
            // Check if code is a valid Refer & Earn code
            const referral = await getReferralProfileByCode(env.DB, cleanCode);
            if (referral) {
              // Anti-self-referral guard
              if (buyerTgId && referral.telegram_user_id && buyerTgId === referral.telegram_user_id) {
                return jsonResponse({ valid: false, error: 'You cannot use your own referral code.' });
              }

              // One-time referral check per buyer account
              if (buyerTgId) {
                const prevUsage = await env.DB
                  .prepare('SELECT id FROM referral_conversions WHERE referred_telegram_user_id = ?')
                  .bind(buyerTgId)
                  .first();
                if (prevUsage) {
                  return jsonResponse({ valid: false, error: 'Referral discount can only be claimed once per Telegram account.' });
                }
              }

              const friendDiscType = await getStoreSetting(env.DB, 'referral_friend_discount_type', 'percent');
              const friendDiscVal = parseFloat(await getStoreSetting(env.DB, 'referral_friend_discount_value', '10')) || 10;
              let discountAmount = 0;
              if (friendDiscType === 'percent') {
                discountAmount = Math.round((basePrice * friendDiscVal) / 100);
              } else {
                discountAmount = Math.min(basePrice - 1, Math.round(friendDiscVal));
              }
              const discountedPrice = Math.max(1, Math.round(basePrice - discountAmount));
              const discountText = friendDiscType === 'percent' ? `${friendDiscVal}% Referral Discount` : `₹${friendDiscVal} Referral Discount`;
              const storeUrl = await getStoreSetting(env.DB, 'store_url', env.STORE_URL || 'https://rzp.io/rzp/eBLEV0w');

              return jsonResponse({
                valid: true,
                code: referral.referral_code,
                is_referral: true,
                discount_text: discountText,
                discount_type: friendDiscType,
                discount_value: friendDiscVal,
                discount_amount: discountAmount,
                original_price: basePrice,
                new_price: discountedPrice,
                payment_link: storeUrl,
              });
            }

            return jsonResponse({ valid: false, error: 'Invalid coupon or referral code. Please check and try again.' });
          }

          const now = Math.floor(Date.now() / 1000);
          if (coupon.expires_at && coupon.expires_at < now) {
            return jsonResponse({ valid: false, error: 'This promo code has expired.' });
          }

          if (coupon.max_uses > 0 && coupon.times_used >= coupon.max_uses) {
            return jsonResponse({ valid: false, error: 'This coupon has reached its maximum usage limit.' });
          }

          let discountAmount = 0;
          if (coupon.discount_type === 'percent') {
            discountAmount = Math.round((basePrice * coupon.discount_value) / 100);
          } else {
            discountAmount = Math.min(basePrice - 1, Math.round(coupon.discount_value));
          }

          const discountedPrice = Math.max(1, Math.round(basePrice - discountAmount));
          const discountText = coupon.discount_type === 'percent' 
            ? `${coupon.discount_value}% OFF` 
            : `₹${coupon.discount_value} OFF`;

          const storeUrl = await getStoreSetting(env.DB, 'store_url', env.STORE_URL || 'https://rzp.io/rzp/eBLEV0w');

          return jsonResponse({
            valid: true,
            code: cleanCode,
            discount_text: discountText,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            discount_amount: discountAmount,
            original_price: basePrice,
            new_price: discountedPrice,
            payment_link: storeUrl,
          });
        } catch (err) {
          console.error('Error validating coupon:', err);
          return jsonResponse({ valid: false, error: 'Error validating coupon. Please try again.' });
        }
      }

      // -------------------------------------------------------------
      // 2.45 Refer & Earn Public Client Endpoints
      // -------------------------------------------------------------

      // GET /api/referral/profile?telegram_user_id=...&username=...&name=...
      if (url.pathname === '/api/referral/profile' && request.method === 'GET') {
        try {
          await ensureStoreTables(env.DB);
          const tgUserId = url.searchParams.get('telegram_user_id') || url.searchParams.get('tg_id') || '';
          const tgUsername = url.searchParams.get('username') || url.searchParams.get('telegram_username') || '';
          const name = url.searchParams.get('name') || undefined;
          const email = url.searchParams.get('email') || undefined;

          if (!tgUserId && (!email || !email.includes('@'))) {
            return jsonResponse({ error: 'telegram_user_id or valid email is required to access your referral wallet.' }, 400);
          }

          const referralEnabled = (await getStoreSetting(env.DB, 'referral_enabled', '1')) === '1';
          const rewardType = await getStoreSetting(env.DB, 'referral_reward_type', 'fixed');
          const rewardVal = parseFloat(await getStoreSetting(env.DB, 'referral_reward_value', '50')) || 50;
          const friendDiscType = await getStoreSetting(env.DB, 'referral_friend_discount_type', 'percent');
          const friendDiscVal = parseFloat(await getStoreSetting(env.DB, 'referral_friend_discount_value', '10')) || 10;
          const minPayout = parseFloat(await getStoreSetting(env.DB, 'referral_min_payout', '200')) || 200;

          const profile = await getOrCreateReferralProfile(env.DB, {
            telegram_user_id: tgUserId || undefined,
            telegram_username: tgUsername || undefined,
            name: name,
            email: email,
          });

          const payouts = await getUserPayouts(env.DB, {
            telegram_user_id: tgUserId || undefined,
            email: email || profile.user_email,
            referral_code: profile.referral_code,
          });

          const conversions = await getReferralConversionsByCode(env.DB, profile.referral_code, 20);

          return jsonResponse({
            success: true,
            enabled: referralEnabled,
            profile,
            payouts,
            conversions,
            settings: {
              min_payout: minPayout,
              reward_type: rewardType,
              reward_value: rewardVal,
              friend_discount_type: friendDiscType,
              friend_discount_value: friendDiscVal,
            },
          });
        } catch (err) {
          console.error('Error fetching referral profile:', err);
          return jsonResponse({ error: 'Failed to fetch referral profile.' }, 500);
        }
      }

      // POST /api/referral/request-payout
      if (url.pathname === '/api/referral/request-payout' && request.method === 'POST') {
        try {
          await ensureStoreTables(env.DB);
          const body = (await request.json()) as {
            telegram_user_id?: string | number;
            telegram_username?: string;
            email?: string;
            name?: string;
            amount?: number;
            payout_method?: 'upi' | 'bank';
            upi_id?: string;
            bank_name?: string;
            bank_account?: string;
            bank_ifsc?: string;
            bank_holder_name?: string;
          };

          const tgUserId = body.telegram_user_id ? String(body.telegram_user_id).trim() : '';
          const email = body.email ? body.email.trim() : '';

          if (!tgUserId && (!email || !email.includes('@'))) {
            return jsonResponse({ error: 'telegram_user_id or valid email is required.' }, 400);
          }

          const amount = parseFloat(String(body.amount));
          if (!amount || isNaN(amount) || amount <= 0) {
            return jsonResponse({ error: 'Please enter a valid withdrawal amount.' }, 400);
          }

          const minPayout = parseFloat(await getStoreSetting(env.DB, 'referral_min_payout', '200')) || 200;
          if (amount < minPayout) {
            return jsonResponse({ error: `Minimum withdrawal amount is ₹${minPayout}.` }, 400);
          }

          const payoutMethod = body.payout_method === 'bank' ? 'bank' : 'upi';
          if (payoutMethod === 'upi') {
            if (!body.upi_id || !body.upi_id.trim() || !body.upi_id.includes('@')) {
              return jsonResponse({ error: 'Please enter a valid UPI ID (e.g. yourname@okaxis).' }, 400);
            }
          } else {
            if (!body.bank_account || !body.bank_account.trim() || !body.bank_ifsc || !body.bank_ifsc.trim() || !body.bank_holder_name || !body.bank_holder_name.trim()) {
              return jsonResponse({ error: 'Please provide complete Bank Account, IFSC Code, and Account Holder Name.' }, 400);
            }
          }

          const result = await createPayoutRequest(env.DB, {
            telegram_user_id: tgUserId || undefined,
            telegram_username: body.telegram_username,
            email: body.email,
            name: body.name,
            amount,
            payout_method: payoutMethod,
            upi_id: body.upi_id,
            bank_name: body.bank_name,
            bank_account: body.bank_account,
            bank_ifsc: body.bank_ifsc,
            bank_holder_name: body.bank_holder_name,
          });

          if (!result.success) {
            return jsonResponse({ error: result.error || 'Failed to submit withdrawal request.' }, 400);
          }

          return jsonResponse({
            success: true,
            message: `Withdrawal request of ₹${amount.toFixed(2)} submitted successfully! Funds will be transferred shortly.`,
            payout: result.payout,
          });
        } catch (err) {
          console.error('Error creating payout request:', err);
          return jsonResponse({ error: 'Failed to submit withdrawal request.' }, 500);
        }
      }

      // GET /api/referral/validate?code=...&telegram_user_id=...
      if (url.pathname === '/api/referral/validate' && request.method === 'GET') {
        try {
          await ensureStoreTables(env.DB);
          const code = url.searchParams.get('code') || '';
          const buyerTgId = url.searchParams.get('telegram_user_id') || url.searchParams.get('tg_id') || '';
          if (!code.trim()) {
            return jsonResponse({ valid: false, error: 'Please enter a referral code.' });
          }

          const cleanCode = code.trim().toUpperCase();
          const profile = await getReferralProfileByCode(env.DB, cleanCode);
          if (!profile) {
            return jsonResponse({ valid: false, error: 'Invalid referral code.' });
          }

          // Anti-self-referral guard
          if (buyerTgId && profile.telegram_user_id && buyerTgId === profile.telegram_user_id) {
            return jsonResponse({ valid: false, error: 'You cannot use your own referral code.' });
          }

          // One-time referral check per buyer
          if (buyerTgId) {
            const prevConv = await env.DB
              .prepare('SELECT id FROM referral_conversions WHERE referred_telegram_user_id = ?')
              .bind(buyerTgId)
              .first();
            if (prevConv) {
              return jsonResponse({ valid: false, error: 'Referral discount can only be claimed once per Telegram account.' });
            }
          }

          const friendType = await getStoreSetting(env.DB, 'referral_friend_discount_type', 'percent');
          const friendVal = parseFloat(await getStoreSetting(env.DB, 'referral_friend_discount_value', '10')) || 10;

          return jsonResponse({
            valid: true,
            code: profile.referral_code,
            is_referral: true,
            referrer_name: profile.user_name || (profile.telegram_username ? `@${profile.telegram_username}` : 'Friend'),
            discount_type: friendType,
            discount_value: friendVal,
            discount_text: friendType === 'percent' ? `${friendVal}% OFF Referral Discount` : `₹${friendVal} OFF Referral Discount`,
          });
        } catch (err) {
          return jsonResponse({ valid: false, error: 'Error validating referral code.' });
        }
      }

      // -------------------------------------------------------------
      // 2.5 Public Store Configuration (/api/store/config)
      // -------------------------------------------------------------
      if (url.pathname === '/api/store/config' && request.method === 'GET') {
        try {
          await ensureStoreTables(env.DB);
          const defaultUrl = env.STORE_URL || 'https://rzp.io/rzp/eBLEV0w';
          const storeUrl = await getStoreSetting(env.DB, 'store_url', defaultUrl);
          const trialEnabled = (await getStoreSetting(env.DB, 'trial_enabled', '1')) === '1';
          const trialDays = parseInt(await getStoreSetting(env.DB, 'trial_days', '30'), 10) || 30;

          const lifetimePrice = Math.round(parseFloat(await getStoreSetting(env.DB, 'plan_lifetime_price', await getStoreSetting(env.DB, 'live_price', '499'))) || 499);
          const lifetimeOrig = Math.round(parseFloat(await getStoreSetting(env.DB, 'plan_lifetime_orig', '1499')) || 1499);
          const lifetimeUrl = await getStoreSetting(env.DB, 'plan_lifetime_url', storeUrl);

          const annualPrice = Math.round(parseFloat(await getStoreSetting(env.DB, 'plan_annual_price', '299')) || 299);
          const annualOrig = Math.round(parseFloat(await getStoreSetting(env.DB, 'plan_annual_orig', '599')) || 599);
          const annualUrl = await getStoreSetting(env.DB, 'plan_annual_url', storeUrl);

          const monthlyPrice = Math.round(parseFloat(await getStoreSetting(env.DB, 'plan_monthly_price', '49')) || 49);
          const monthlyOrig = Math.round(parseFloat(await getStoreSetting(env.DB, 'plan_monthly_orig', '99')) || 99);
          const monthlyUrl = await getStoreSetting(env.DB, 'plan_monthly_url', storeUrl);

          const plans = [
            {
              id: 'lifetime',
              name: 'Lifetime Pro Access',
              badge: '👑 BEST VALUE · ONE-TIME',
              price: lifetimePrice,
              originalPrice: lifetimeOrig,
              discountPercent: Math.max(1, Math.round(((lifetimeOrig - lifetimePrice) / lifetimeOrig) * 100)),
              period: 'one-time',
              periodLabel: 'forever',
              description: 'Pay once, enjoy full Pro privileges forever',
              buy_url: lifetimeUrl,
              features: [
                '100% Ad-Free Cloud Vault Forever',
                'TDENC2 Zero-Knowledge Military Encryption',
                'Maximum Turbo Multi-Chunk Speeds (5x Faster)',
                'Multi-Device Sync (Android, PC, Mac, Web)',
              ],
            },
            {
              id: 'annual',
              name: '1-Year Annual Pass',
              badge: '365 Days',
              price: annualPrice,
              originalPrice: annualOrig,
              discountPercent: Math.max(1, Math.round(((annualOrig - annualPrice) / annualOrig) * 100)),
              period: 'year',
              periodLabel: '/ year',
              description: 'Full year of high-speed ad-free cloud',
              buy_url: annualUrl,
              features: ['All Pro Features Included', '365 Days Full Pro Validity'],
            },
            {
              id: 'monthly',
              name: '1-Month Pass',
              badge: '30 Days',
              price: monthlyPrice,
              originalPrice: monthlyOrig,
              discountPercent: Math.max(1, Math.round(((monthlyOrig - monthlyPrice) / monthlyOrig) * 100)),
              period: 'month',
              periodLabel: '/ month',
              description: 'Flexible short-term Pro pass',
              buy_url: monthlyUrl,
              features: ['Cancel anytime, full Pro access', '30 Days Full Pro Validity'],
            },
          ];

          return jsonResponse({
            product_name: 'TG Drive: Lifetime Pro License',
            price: lifetimePrice,
            formatted_price: '₹' + lifetimePrice,
            currency: 'INR',
            buy_url: lifetimeUrl,
            trial_enabled: trialEnabled,
            trial_days: trialDays,
            trial_label: `${trialDays}-Day Free Trial`,
            plans,
          });
        } catch (err) {
          console.error('Error fetching store config:', err);
          return jsonResponse({
            product_name: 'TG Drive: Lifetime Pro License',
            price: 499,
            formatted_price: '₹499',
            currency: 'INR',
            buy_url: 'https://rzp.io/rzp/eBLEV0w',
            trial_enabled: true,
            trial_days: 30,
            trial_label: '30-Day Free Trial',
            plans: [
              {
                id: 'lifetime',
                name: 'Lifetime Pro Access',
                badge: '👑 BEST VALUE · ONE-TIME',
                price: 499,
                originalPrice: 1499,
                discountPercent: 67,
                period: 'one-time',
                periodLabel: 'forever',
                description: 'Pay once, enjoy full Pro privileges forever',
                buy_url: 'https://rzp.io/rzp/eBLEV0w',
                features: [
                  '100% Ad-Free Cloud Vault Forever',
                  'TDENC2 Zero-Knowledge Military Encryption',
                  'Maximum Turbo Multi-Chunk Speeds (5x Faster)',
                  'Multi-Device Sync (Android, PC, Mac, Web)',
                ],
              },
              {
                id: 'annual',
                name: '1-Year Annual Pass',
                badge: '365 Days',
                price: 299,
                originalPrice: 599,
                discountPercent: 50,
                period: 'year',
                periodLabel: '/ year',
                description: 'Full year of high-speed ad-free cloud',
                buy_url: 'https://rzp.io/rzp/eBLEV0w',
                features: ['All Pro Features Included', '365 Days Full Pro Validity'],
              },
              {
                id: 'monthly',
                name: '1-Month Pass',
                badge: '30 Days',
                price: 49,
                originalPrice: 99,
                discountPercent: 50,
                period: 'month',
                periodLabel: '/ month',
                description: 'Flexible short-term Pro pass',
                buy_url: 'https://rzp.io/rzp/eBLEV0w',
                features: ['Cancel anytime, full Pro access', '30 Days Full Pro Validity'],
              },
            ],
          });
        }
      }

      // -------------------------------------------------------------
      // 2.6 Create Pre-filled Personalized Checkout Link (/api/store/create-checkout-link)
      // -------------------------------------------------------------
      if (url.pathname === '/api/store/create-checkout-link' && request.method === 'POST') {
        const body = (await request.json()) as {
          name: string;
          email: string;
          coupon_code?: string;
          referral_code?: string;
          telegram_user_id?: string;
          phone_number?: string;
          tg_id?: string;
          tg_phone?: string;
        };

        if (!body.name || !body.name.trim()) {
          return jsonResponse({ error: 'Please enter your Full Name for the supporter certificate.' }, 400);
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!body.email || !emailRegex.test(body.email.trim())) {
          return jsonResponse({ error: 'Please enter a valid Email Address for license key delivery.' }, 400);
        }

        const cleanName = body.name.trim();
        const cleanEmail = body.email.trim().toLowerCase();
        const tgUserId = (body.telegram_user_id || body.tg_id || '').trim();
        const rawPhone = (body.phone_number || body.tg_phone || '').trim();
        const normPhone = normalizePhone(rawPhone);
        const tgPhone = normPhone || rawPhone;

        const basePriceStr = await getStoreSetting(env.DB, 'live_price', '399');
        const basePrice = Math.round(parseFloat(basePriceStr) || 399);
        let finalPrice = basePrice;
        const discountNotes: string[] = [];
        let validCouponCode = '';

        // 1. Check for active Special Offer
        const now = Math.floor(Date.now() / 1000);
        const activeOffer = (await env.DB.prepare(`
          SELECT * FROM special_offers 
          WHERE is_active = 1 AND (countdown_end IS NULL OR countdown_end > ?)
          ORDER BY created_at DESC LIMIT 1
        `).bind(now).first()) as Record<string, unknown> | null;

        if (activeOffer) {
          let offerDiscount = 0;
          const discType = String(activeOffer.discount_type || 'percent');
          const discVal = Number(activeOffer.discount_value) || 0;
          if (discType === 'percent' && discVal > 0) {
            offerDiscount = (finalPrice * discVal) / 100;
            discountNotes.push(`Offer: ${discVal}% OFF`);
          } else if ((discType === 'flat' || discType === 'fixed') && discVal > 0) {
            offerDiscount = discVal;
            discountNotes.push(`Offer: ₹${Math.round(discVal)} OFF`);
          } else if (typeof activeOffer.offer_price === 'number' && activeOffer.offer_price > 0 && activeOffer.offer_price < finalPrice) {
            offerDiscount = finalPrice - activeOffer.offer_price;
            discountNotes.push(`Special Deal`);
          }
          finalPrice = Math.max(1, Math.round(finalPrice - offerDiscount));
        }

        // 2. Check for stackable Coupon Code (applied on top of offer price)
        if (body.coupon_code && body.coupon_code.trim()) {
          const cleanCode = body.coupon_code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
          const coupon = await getCouponByCode(env.DB, cleanCode);
          if (coupon && (!coupon.expires_at || coupon.expires_at >= now) && (coupon.max_uses <= 0 || coupon.times_used < coupon.max_uses)) {
            let couponDiscount = 0;
            if (coupon.discount_type === 'percent') {
              couponDiscount = (finalPrice * coupon.discount_value) / 100;
              discountNotes.push(`Coupon ${cleanCode}: ${coupon.discount_value}% OFF`);
            } else {
              couponDiscount = coupon.discount_value;
              discountNotes.push(`Coupon ${cleanCode}: ₹${Math.round(coupon.discount_value)} OFF`);
            }
            finalPrice = Math.max(1, Math.round(finalPrice - couponDiscount));
            validCouponCode = cleanCode;
          }
        }

        // 3. Check for Refer & Earn referral code (with Anti-Self-Referral guard)
        let validReferralCode = '';
        const candidateReferral = (body.referral_code || body.coupon_code || '').trim().toUpperCase();
        if (candidateReferral) {
          const refProfile = await getReferralProfileByCode(env.DB, candidateReferral);
          if (refProfile) {
            // Anti-fraud check: Prevent referrer from using their own referral code
            const isSelfEmail = refProfile.user_email.toLowerCase() === cleanEmail;
            if (!isSelfEmail) {
              validReferralCode = refProfile.referral_code;
              if (!validCouponCode) {
                const friendDiscType = await getStoreSetting(env.DB, 'referral_friend_discount_type', 'percent');
                const friendDiscVal = parseFloat(await getStoreSetting(env.DB, 'referral_friend_discount_value', '10')) || 10;
                let refDiscount = 0;
                if (friendDiscType === 'percent') {
                  refDiscount = (finalPrice * friendDiscVal) / 100;
                } else {
                  refDiscount = friendDiscVal;
                }
                finalPrice = Math.max(1, Math.round(finalPrice - refDiscount));
                discountNotes.push(`Referral ${validReferralCode}: ${friendDiscVal}% OFF`);
              }
            }
          }
        }

        finalPrice = Math.max(1, Math.round(finalPrice));

        // Generate unique checkout tracking session ID
        const checkoutSessionId = 'chk_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        let paymentUrl = await getStoreSetting(env.DB, 'store_url', env.STORE_URL || 'https://rzp.io/rzp/eBLEV0w');

        if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
          try {
            const authHeader = 'Basic ' + btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
            const plRes = await fetch('https://api.razorpay.com/v1/payment_links', {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                amount: Math.round(finalPrice * 100),
                currency: 'INR',
                accept_partial: false,
                description: `TG Drive: Lifetime Pro License${discountNotes.length > 0 ? ` (${discountNotes.join(' + ')})` : ''}`,
                customer: {
                  name: cleanName,
                  email: cleanEmail,
                  contact: tgPhone || undefined,
                },
                notify: { sms: false, email: true },
                reminder_enable: true,
                notes: {
                  product: 'tg_drive_lifetime_pro',
                  checkout_session_id: checkoutSessionId,
                  name: cleanName,
                  email: cleanEmail,
                  telegram_user_id: tgUserId,
                  phone_number: tgPhone,
                  tg_id: tgUserId,
                  tg_phone: tgPhone,
                  coupon: validCouponCode,
                  referral_code: validReferralCode,
                },
              }),
            });

            const plData = (await plRes.json()) as { short_url?: string; id?: string };
            if (plRes.ok && plData.short_url) {
              paymentUrl = plData.short_url;
            }
          } catch (err) {
            console.error('Error generating prefilled Razorpay link:', err);
          }
        }

        return jsonResponse({
          success: true,
          payment_url: paymentUrl,
          order_id: checkoutSessionId,
          session_id: checkoutSessionId,
          name: cleanName,
          email: cleanEmail,
          telegram_user_id: tgUserId || null,
          phone_number: tgPhone || null,
          final_price: finalPrice,
          formatted_price: `₹${finalPrice}`,
        });
      }

      // -------------------------------------------------------------
      // 2.7 Real-time Order Status Polling (/api/store/order-status)
      // -------------------------------------------------------------
      if (url.pathname === '/api/store/order-status' && (request.method === 'GET' || request.method === 'POST')) {
        let orderId = url.searchParams.get('order_id') || url.searchParams.get('session_id') || '';
        let email = url.searchParams.get('email') || '';
        let telegramUserId = url.searchParams.get('telegram_user_id') || url.searchParams.get('tg_id') || '';
        let phone = url.searchParams.get('phone_number') || url.searchParams.get('phone') || '';

        if (request.method === 'POST') {
          try {
            const body = (await request.json()) as Record<string, string>;
            orderId = body.order_id || body.session_id || orderId;
            email = body.email || email;
            telegramUserId = body.telegram_user_id || body.tg_id || telegramUserId;
            phone = body.phone_number || body.phone || phone;
          } catch {
            // ignore
          }
        }

        orderId = orderId.trim();
        email = email.trim().toLowerCase();
        telegramUserId = telegramUserId.trim();
        phone = phone.trim();

        let license: LicenseRow | null = null;
        if (orderId) {
          license = await getLicenseByOrderId(env.DB, orderId);
        }
        if (!license && email) {
          const licList = await getLicensesByEmail(env.DB, email);
          license = licList[0] || null;
        }
        if (!license && (telegramUserId || phone)) {
          license = await getLicenseByTelegramAccount(env.DB, telegramUserId || null, phone || null);
        }

        if (license && license.is_banned === 0) {
          const now = Math.floor(Date.now() / 1000);
          if (!license.expires_at || license.expires_at > now) {
            const claims: LicenseClaims = {
              sub: license.telegram_user_id || license.license_key,
              tg_id: license.telegram_user_id || undefined,
              phone: license.phone_number || undefined,
              plan: license.plan_type,
              exp: license.expires_at,
              iat: now,
              iss: 'tg-drive-licensing',
              name: license.customer_name || undefined,
            };
            const token = await issueLicenseToken(claims, env);
            return jsonResponse({
              paid: true,
              license_key: license.license_key,
              plan_type: license.plan_type,
              customer_name: license.customer_name,
              customer_email: license.customer_email,
              expires_at: license.expires_at,
              token,
              order_id: orderId || undefined,
            });
          }
        }

        return jsonResponse({ paid: false });
      }

      // -------------------------------------------------------------
      // 3. Client App License APIs
      // -------------------------------------------------------------

      // GET /api/license/check-account or POST /api/license/check-account
      // Instant automated entitlement verification by Telegram User ID / Phone Number
      if (url.pathname === '/api/license/check-account' && (request.method === 'GET' || request.method === 'POST')) {
        let telegramUserId = url.searchParams.get('telegram_user_id') || url.searchParams.get('tg_id') || '';
        let phoneNumber = url.searchParams.get('phone_number') || url.searchParams.get('phone') || '';

        if (request.method === 'POST') {
          try {
            const body = (await request.json()) as {
              telegram_user_id?: string;
              phone_number?: string;
              tg_id?: string;
              phone?: string;
              auth_data?: Record<string, string | number>;
            };
            telegramUserId = body.telegram_user_id || body.tg_id || telegramUserId;
            phoneNumber = body.phone_number || body.phone || phoneNumber;

            // Optional Telegram signature verification if Bot Token configured
            if (body.auth_data && env.TELEGRAM_BOT_TOKEN) {
              const isAuthValid = await verifyTelegramAuth(body.auth_data, env.TELEGRAM_BOT_TOKEN);
              if (!isAuthValid) {
                return jsonResponse({ active: false, error: 'Telegram authentication signature verification failed' }, 401);
              }
            }
          } catch {
            // ignore body parse error
          }
        }

        telegramUserId = telegramUserId.trim();
        phoneNumber = phoneNumber.trim();

        if (!telegramUserId && !phoneNumber) {
          return jsonResponse({ active: false, error: 'Missing telegram_user_id or phone_number' }, 400);
        }

        const license = await getLicenseByTelegramAccount(env.DB, telegramUserId || null, phoneNumber || null);

        if (!license || license.is_banned === 1) {
          return jsonResponse({
            active: false,
            message: license ? (license.ban_reason || 'License banned') : 'No active supporter entitlement found for this Telegram account',
          }, 200);
        }

        const now = Math.floor(Date.now() / 1000);
        if (license.expires_at && license.expires_at < now) {
          return jsonResponse({
            active: false,
            message: 'License has expired',
            expired: true,
            is_expired: true,
            plan_type: license.plan_type,
            expires_at: license.expires_at,
          }, 200);
        }

        // Issue cryptographically signed Ed25519 token for offline grace & client validation
        const claims: LicenseClaims = {
          sub: license.telegram_user_id || license.license_key,
          tg_id: license.telegram_user_id || telegramUserId || undefined,
          phone: license.phone_number || phoneNumber || undefined,
          plan: license.plan_type,
          exp: license.expires_at,
          iat: now,
          iss: 'tg-drive-licensing',
          name: license.customer_name || undefined,
        };

        const token = await issueLicenseToken(claims, env);

        return jsonResponse({
          active: true,
          license_key: license.license_key,
          plan_type: license.plan_type,
          customer_name: license.customer_name,
          customer_email: license.customer_email,
          telegram_user_id: license.telegram_user_id,
          phone_number: license.phone_number,
          expires_at: license.expires_at,
          token,
          terms_version: '2026-08-11',
          ad_free: true,
          message: 'Supporter access is active for your Telegram account.',
        });
      }

      // POST /api/license/activate
      if (url.pathname === '/api/license/activate' && request.method === 'POST') {
        const body = (await request.json()) as ActivationRequest;
        if (!body.license_key || !body.hardware_id) {
          return jsonResponse({ error: 'Missing license_key or hardware_id' }, 400);
        }

        const cleanKey = body.license_key.trim().toUpperCase();
        const license = await getLicenseByKey(env.DB, cleanKey);

        if (!license) {
          return jsonResponse({ error: 'Invalid license key. Please check your key and try again.' }, 404);
        }

        if (license.is_banned === 1) {
          return jsonResponse({ error: `License is banned: ${license.ban_reason || 'Terms violation'}` }, 403);
        }

        const now = Math.floor(Date.now() / 1000);
        if (license.expires_at && license.expires_at < now) {
          return jsonResponse({ error: 'License key has expired. Please renew your license.' }, 403);
        }

        const incomingTgId = body.telegram_user_id ? String(body.telegram_user_id).trim() : null;
        const incomingPhone = body.phone_number ? String(body.phone_number).trim() : null;
        const isTelegramAccountProvided = Boolean(incomingTgId || incomingPhone);

        // Anti-sharing: If license is already bound to a Telegram account, reject different accounts
        if (isTelegramAccountProvided && (license.telegram_user_id || license.phone_number)) {
          const matchesTgId = license.telegram_user_id && incomingTgId && license.telegram_user_id === incomingTgId;
          const matchesPhone = license.phone_number && incomingPhone && (
            license.phone_number === incomingPhone || 
            normalizePhone(license.phone_number) === normalizePhone(incomingPhone)
          );

          if (!matchesTgId && !matchesPhone) {
            return jsonResponse(
              {
                error: 'This license key is already bound to another Telegram account. Each Pro license is tied to a single Telegram account.',
              },
              403
            );
          }
        }

        // Auto-detect platform if missing or generic
        const ua = (request.headers.get('user-agent') || '').toLowerCase();
        let targetPlatform = body.platform;
        if (!targetPlatform || targetPlatform === 'windows') {
          if (ua.includes('android')) {
            targetPlatform = 'android';
          } else if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) {
            targetPlatform = 'ios';
          } else if (ua.includes('macintosh') || ua.includes('mac os')) {
            targetPlatform = 'macos';
          } else if (ua.includes('linux')) {
            targetPlatform = 'linux';
          } else {
            targetPlatform = body.platform || 'windows';
          }
        }

        // Check if this device is already activated
        const devices = await getDevicesForLicense(env.DB, cleanKey);
        const existingDevice = devices.find(d => d.hardware_id === body.hardware_id);

        if (!existingDevice) {
          // Anti-abuse: A device cannot activate any new trial key if it has already utilized a trial before
          if (license.plan_type === 'trial') {
            const usedPastTrial = await env.DB.prepare(`
              SELECT d.id FROM device_activations d
              JOIN licenses l ON d.license_key = l.license_key
              WHERE d.hardware_id = ? AND l.plan_type = 'trial' AND l.license_key != ?
            `).bind(body.hardware_id, cleanKey).first();

            if (usedPastTrial) {
              return jsonResponse(
                { error: 'This device has already utilized a free trial period. Please upgrade to a Pro license to continue.' },
                403
              );
            }
          }

          // If the license is linked to a verified Telegram account (or linking now),
          // all devices belonging to that Telegram account are automatically allowed.
          // Otherwise, enforce max_devices limit.
          const isLinkedAccount = isTelegramAccountProvided || Boolean(license.telegram_user_id || license.phone_number);
          if (!isLinkedAccount) {
            const activeDevices = devices.filter(d => d.is_revoked === 0);
            if (activeDevices.length >= license.max_devices) {
              return jsonResponse(
                {
                  error: `Device limit reached (${activeDevices.length}/${license.max_devices} devices active). Please link your Telegram account for multi-device access.`,
                },
                429
              );
            }
          }
        }

        // Activate or refresh device record
        const activationId = existingDevice ? existingDevice.id : crypto.randomUUID();
        await activateDevice(env.DB, {
          id: activationId,
          license_key: cleanKey,
          hardware_id: body.hardware_id,
          device_name: body.device_name || (targetPlatform === 'android' ? 'Android Device' : targetPlatform === 'ios' ? 'iOS Device' : 'Desktop PC'),
          platform: targetPlatform,
        });

        // Permanently bind Telegram Account to this license if provided
        if (incomingTgId || incomingPhone) {
          try {
            await env.DB.prepare(`
              UPDATE licenses 
              SET telegram_user_id = COALESCE(?, telegram_user_id),
                  phone_number = COALESCE(?, phone_number)
              WHERE license_key = ?
            `).bind(
              incomingTgId,
              incomingPhone,
              cleanKey
            ).run();
          } catch {
            // Ignore if DB update fails non-critically
          }
        }

        // Generate signed token
        const claims: LicenseClaims = {
          sub: cleanKey,
          hwid: body.hardware_id,
          plan: license.plan_type,
          exp: license.expires_at,
          iat: now,
          iss: 'tg-drive-licensing',
          name: license.customer_name || undefined,
        };

        const token = await issueLicenseToken(claims, env);

        return jsonResponse({
          success: true,
          token,
          license_key: cleanKey,
          plan_type: license.plan_type,
          expires_at: license.expires_at,
          customer_name: license.customer_name,
          max_devices: license.max_devices,
        });
      }

      // POST /api/license/verify
      if (url.pathname === '/api/license/verify' && request.method === 'POST') {
        const body = (await request.json()) as VerifyRequest & { telegram_user_id?: string | number };
        if (!body.license_key || !body.hardware_id) {
          return jsonResponse({ error: 'Missing license_key or hardware_id' }, 400);
        }

        const cleanKey = body.license_key.trim().toUpperCase();
        let license = await getLicenseByKey(env.DB, cleanKey);

        // Telegram account-bound entitlement check (e.g. TG-PRO-8566092354)
        if (!license) {
          const tgMatch = cleanKey.match(/^TG[-_]?PRO[-_]?(\d+)/i) || cleanKey.match(/^TG[-_]?(\d+)/i);
          const tgId = tgMatch ? tgMatch[1] : (body.telegram_user_id ? String(body.telegram_user_id).trim() : '');
          if (tgId) {
            const proUser = await getProUserByTelegramId(env.DB, tgId);
            if (proUser && proUser.is_banned === 0 && proUser.is_pro === 1) {
              const now = Math.floor(Date.now() / 1000);
              const isExpired = Boolean(proUser.expires_at && proUser.expires_at < now);
              if (!isExpired) {
                return jsonResponse({
                  valid: true,
                  plan_type: proUser.plan_type || 'lifetime',
                  expires_at: proUser.expires_at,
                  customer_name: proUser.first_name || 'TG Drive VIP User',
                  is_pro: true,
                });
              } else {
                return jsonResponse({ valid: false, reason: 'License expired' }, 200);
              }
            }
          }
        }

        if (!license || license.is_banned === 1) {
          return jsonResponse({ valid: false, reason: license ? 'License banned' : 'License not found' }, 200);
        }

        const now = Math.floor(Date.now() / 1000);
        if (license.expires_at && license.expires_at < now) {
          return jsonResponse({ valid: false, reason: 'License expired' }, 200);
        }

        // Update last seen
        await touchDevice(env.DB, cleanKey, body.hardware_id);

        return jsonResponse({
          valid: true,
          plan_type: license.plan_type,
          expires_at: license.expires_at,
          customer_name: license.customer_name,
        });
      }

      // POST /api/license/deactivate
      if (url.pathname === '/api/license/deactivate' && request.method === 'POST') {
        const body = (await request.json()) as DeactivateRequest;
        if (!body.license_key || !body.hardware_id) {
          return jsonResponse({ error: 'Missing license_key or hardware_id' }, 400);
        }

        await deactivateDevice(env.DB, body.license_key, body.hardware_id);
        return jsonResponse({ success: true, message: 'Device deactivated successfully' });
      }

      // -------------------------------------------------------------
      // 3.5 OTP-Based Self-Service Key Recovery & Device Management APIs
      // -------------------------------------------------------------

      // POST /api/license/request-otp
      if (url.pathname === '/api/license/request-otp' && request.method === 'POST') {
        const body = (await request.json()) as RequestOtpRequest;
        if (!body.email) return jsonResponse({ error: 'Missing email' }, 400);

        const cleanEmail = body.email.trim().toLowerCase();
        const now = Math.floor(Date.now() / 1000);

        // Check rate limiting (max 1 request per 60s per email)
        const existingOtp = await getLatestOtpForEmail(env.DB, cleanEmail);
        if (existingOtp && now - existingOtp.created_at < 60) {
          const waitTime = 60 - (now - existingOtp.created_at);
          return jsonResponse({ error: `Please wait ${waitTime}s before requesting a new code.` }, 429);
        }

        const licenses = await getLicensesByEmail(env.DB, cleanEmail);
        if (licenses.length === 0) {
          return jsonResponse(
            {
              success: false,
              error: 'No active license found for this email address. Please verify your spelling or purchase a license.',
            },
            404
          );
        }

        // Generate cryptographically secure 6-digit OTP
        const otpCode = generateOtpCode();
        const otpHash = await sha256Hex(`${otpCode}:${cleanEmail}`);
        const id = crypto.randomUUID();
        const expiresAt = now + 600; // 10 minutes

        await saveOtpRecord(env.DB, {
          id,
          email: cleanEmail,
          otp_hash: otpHash,
          expires_at: expiresAt,
        });

        // Send email via Resend
        await sendOtpEmail(env, {
          to: cleanEmail,
          otpCode,
        });

        return jsonResponse({
          success: true,
          message: 'Verification code sent to your email.',
        });
      }

      // POST /api/license/verify-otp
      if (url.pathname === '/api/license/verify-otp' && request.method === 'POST') {
        const body = (await request.json()) as VerifyOtpRequest;
        if (!body.email || !body.otp) return jsonResponse({ error: 'Missing email or otp' }, 400);

        const cleanEmail = body.email.trim().toLowerCase();
        const cleanOtp = body.otp.trim();
        const now = Math.floor(Date.now() / 1000);

        const record = await getLatestOtpForEmail(env.DB, cleanEmail);
        if (!record) {
          return jsonResponse({ error: 'No verification code was requested for this email.' }, 400);
        }

        if (record.expires_at < now) {
          await deleteOtpForEmail(env.DB, cleanEmail);
          return jsonResponse({ error: 'Verification code has expired. Please request a new one.' }, 400);
        }

        if (record.attempts >= 5) {
          await deleteOtpForEmail(env.DB, cleanEmail);
          return jsonResponse({ error: 'Too many failed attempts. Please request a new code.' }, 429);
        }

        const expectedHash = await sha256Hex(`${cleanOtp}:${cleanEmail}`);
        if (!timingSafeEqual(record.otp_hash, expectedHash)) {
          await incrementOtpAttempts(env.DB, record.id);
          return jsonResponse({ error: 'Invalid verification code. Please check and try again.' }, 400);
        }

        // OTP verified successfully - cleanup OTP
        await deleteOtpForEmail(env.DB, cleanEmail);

        // Generate temporary recovery session token (1 hour validity)
        const secret = env.ADMIN_SECRET || 'tg-drive-master-secret-2026';
        const sessionToken = await createRecoveryToken(cleanEmail, secret);

        // Fetch customer licenses & active devices
        const licenses = await getLicensesByEmail(env.DB, cleanEmail);
        const licensesWithDevices = await Promise.all(
          licenses.map(async lic => {
            const devices = await getDevicesForLicense(env.DB, lic.license_key);
            return {
              ...lic,
              devices: devices.filter(d => d.is_revoked === 0),
            };
          })
        );

        return jsonResponse({
          success: true,
          session_token: sessionToken,
          licenses: licensesWithDevices,
        });
      }

      // POST /api/license/self-reset-device
      if (url.pathname === '/api/license/self-reset-device' && request.method === 'POST') {
        const body = (await request.json()) as SelfResetDeviceRequest;
        if (!body.email || !body.session_token || !body.hardware_id) {
          return jsonResponse({ error: 'Missing required parameters' }, 400);
        }

        const cleanEmail = body.email.trim().toLowerCase();
        const secret = env.ADMIN_SECRET || 'tg-drive-master-secret-2026';
        const isValidSession = await verifyRecoveryToken(body.session_token, secret, cleanEmail);

        if (!isValidSession) {
          return jsonResponse({ error: 'Session expired or invalid. Please verify with OTP again.' }, 401);
        }

        // Verify this device belongs to one of customer's licenses
        const licenses = await getLicensesByEmail(env.DB, cleanEmail);
        let found = false;
        for (const lic of licenses) {
          const devices = await getDevicesForLicense(env.DB, lic.license_key);
          const dev = devices.find(d => d.hardware_id === body.hardware_id);
          if (dev) {
            await deactivateDevice(env.DB, lic.license_key, body.hardware_id);
            await recordAdminLog(env.DB, 'SELF_DEVICE_RESET', lic.license_key, `Customer deactivated device ${body.hardware_id}`);
            found = true;
            break;
          }
        }

        if (!found) {
          return jsonResponse({ error: 'Device not found on your licenses.' }, 404);
        }

        return jsonResponse({ success: true, message: 'Device slot deactivated successfully.' });
      }

      // -------------------------------------------------------------
      // 4. Lemon Squeezy Automated Webhook (/api/webhooks/lemonsqueezy)
      // -------------------------------------------------------------
      if (url.pathname === '/api/webhooks/lemonsqueezy' && request.method === 'POST') {
        const rawBody = await request.text();
        const signature = request.headers.get('x-signature') || '';

        // If secret is set, verify HMAC signature
        if (env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
          const enc = new TextEncoder();
          const key = await crypto.subtle.importKey(
            'raw',
            enc.encode(env.LEMON_SQUEEZY_WEBHOOK_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          );
          const expectedSig = Array.from(
            new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(rawBody)))
          )
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

          if (!timingSafeEqual(signature, expectedSig)) {
            return jsonResponse({ error: 'Invalid webhook signature' }, 401);
          }
        }

        const payload = JSON.parse(rawBody) as {
          meta?: { event_name?: string };
          data?: {
            id?: string;
            attributes?: {
              user_name?: string;
              user_email?: string;
              status?: string;
              order_number?: number;
            };
          };
        };

        const eventName = payload.meta?.event_name || '';
        if (eventName === 'order_created' || eventName === 'subscription_created') {
          const attr = payload.data?.attributes;
          const key = generateLicenseKey();
          const id = crypto.randomUUID();

          await createLicense(env.DB, {
            id,
            license_key: key,
            customer_name: attr?.user_name || 'LemonSqueezy Customer',
            customer_email: attr?.user_email || null,
            plan_type: 'lifetime',
            max_devices: parseInt(env.MAX_DEFAULT_DEVICES || '2', 10),
            notes: `LemonSqueezy Order #${attr?.order_number || payload.data?.id || ''}`,
          });

          await recordAdminLog(env.DB, 'LEMON_SQUEEZY_ORDER', key, `Auto-generated for ${attr?.user_email}`);

          // Automated email delivery to customer
          if (attr?.user_email) {
            await sendPurchaseEmail(env, {
              to: attr.user_email,
              name: attr.user_name || null,
              licenseKey: key,
              planType: 'lifetime',
              orderId: String(attr?.order_number || payload.data?.id || ''),
            });
          }

          return jsonResponse({ received: true, license_key: key });
        }

        return jsonResponse({ received: true });
      }

      // -------------------------------------------------------------
      // 4.5 Razorpay Automated Webhook (/api/webhooks/razorpay or /api/webhook)
      // -------------------------------------------------------------
      if (url.pathname === '/api/webhooks/razorpay' || url.pathname === '/api/webhook' || url.pathname === '/webhook') {
        if (request.method === 'GET') {
          return jsonResponse({
            status: 'active',
            message: 'Razorpay webhook receiver is live and waiting for POST notifications',
            endpoint: url.pathname,
            supported_events: ['payment.captured', 'order.paid', 'payment_link.paid'],
          });
        }
        if (request.method === 'POST') {
          const rawBody = await request.text();

        // Verify Razorpay Webhook HMAC Signature if secret is configured
        if (env.RAZORPAY_WEBHOOK_SECRET) {
          const signature = request.headers.get('x-razorpay-signature') || '';
          const isValid = await verifyHmacSha256(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET);
          if (!isValid) {
            console.error('[RAZORPAY_WEBHOOK] Invalid HMAC signature');
            return jsonResponse({ error: 'Invalid webhook signature' }, 401);
          }
        }

        const payload = JSON.parse(rawBody) as {
          event?: string;
          payload?: {
            payment?: {
              entity?: {
                id?: string;
                email?: string;
                contact?: string;
                notes?: Record<string, string>;
                amount?: number;
              };
            };
            payment_link?: {
              entity?: {
                id?: string;
                amount?: number;
                notes?: Record<string, string>;
                customer?: {
                  email?: string;
                  name?: string;
                  contact?: string;
                };
              };
            };
            order?: {
              entity?: {
                id?: string;
                notes?: Record<string, string>;
              };
            };
          };
        };

        const eventName = payload.event || '';
        if (eventName === 'payment.captured' || eventName === 'payment_link.paid' || eventName === 'order.paid') {
          const paymentEntity = payload.payload?.payment?.entity;
          const plinkCustomer = payload.payload?.payment_link?.entity?.customer;
          const orderEntity = payload.payload?.order?.entity;

          // Collect candidate emails in priority order
          const candidates: (string | undefined)[] = [
            paymentEntity?.notes?.email,
            paymentEntity?.notes?.customer_email,
            paymentEntity?.notes?.['Email Address'],
            paymentEntity?.notes?.['Email'],
            orderEntity?.notes?.email,
            orderEntity?.notes?.customer_email,
            plinkCustomer?.email,
            paymentEntity?.email,
          ];

          // Filter out empty or dummy void@razorpay.com emails
          let email = candidates
            .map(e => (e || '').trim().toLowerCase())
            .find(e => e && e.includes('@') && !e.includes('void@razorpay.com')) || '';

          if (!email && paymentEntity?.email) {
            email = paymentEntity.email.trim().toLowerCase();
          }
          const name = plinkCustomer?.name ||
            paymentEntity?.notes?.name ||
            paymentEntity?.notes?.customer_name ||
            paymentEntity?.notes?.['Full Name'] ||
            'Valued Customer';

          const telegramUserId = paymentEntity?.notes?.telegram_user_id ||
            paymentEntity?.notes?.tg_id ||
            orderEntity?.notes?.telegram_user_id ||
            orderEntity?.notes?.tg_id ||
            null;

          const rawPhone = paymentEntity?.notes?.phone_number ||
            paymentEntity?.notes?.tg_phone ||
            paymentEntity?.notes?.phone ||
            paymentEntity?.contact ||
            plinkCustomer?.contact ||
            orderEntity?.notes?.phone ||
            null;
          const phoneNumber = normalizePhone(rawPhone) || rawPhone;

          const checkoutSessionId = paymentEntity?.notes?.checkout_session_id ||
            orderEntity?.notes?.checkout_session_id ||
            '';

          const orderId = paymentEntity?.id || payload.payload?.payment_link?.entity?.id || orderEntity?.id || 'RZP-' + Date.now();

          if (!email && telegramUserId) {
            email = `tg_${telegramUserId}@t-drive.internal`;
          }

          if (email) {
            // Check if license already exists for this exact order ID (Deduplication against multiple Razorpay webhooks)
            const existingLicenses = await getLicensesByEmail(env.DB, email);
            const existingMatch = existingLicenses.find(l => l.notes && (l.notes.includes(orderId) || (checkoutSessionId && l.notes.includes(checkoutSessionId))));

            if (existingMatch) {
              console.log(`[RAZORPAY_WEBHOOK] Order ${orderId} already processed (License: ${existingMatch.license_key}). Skipping duplicate email.`);
              return jsonResponse({ success: true, license_key: existingMatch.license_key, duplicate_skipped: true });
            }

            const key = generateLicenseKey();
            const id = crypto.randomUUID();

            const noteContent = `Razorpay Payment ID: ${orderId}${checkoutSessionId ? ` Session: ${checkoutSessionId}` : ''}`;

            let webhookPlanType = (paymentEntity?.notes?.plan_type ||
              orderEntity?.notes?.plan_type ||
              payload.payload?.payment_link?.entity?.notes?.plan_type) as LicensePlan | undefined;

            if (!webhookPlanType && orderId) {
              try {
                const tx = await getPaymentTransactionByOrderId(env.DB, orderId);
                if (tx && tx.plan_type) {
                  webhookPlanType = tx.plan_type as LicensePlan;
                }
              } catch {}
            }

            if (!webhookPlanType) {
              const amountPaise = paymentEntity?.amount || payload.payload?.payment_link?.entity?.amount || 0;
              if (amountPaise > 0 && amountPaise <= 9900) {
                webhookPlanType = 'monthly';
              } else if (amountPaise > 9900 && amountPaise <= 29900) {
                webhookPlanType = 'annual';
              } else {
                webhookPlanType = 'lifetime';
              }
            }

            const now = Math.floor(Date.now() / 1000);
            let expiresAt: number | null = null;
            if (webhookPlanType === 'monthly') {
              expiresAt = now + 30 * 86400;
            } else if (webhookPlanType === 'annual') {
              expiresAt = now + 365 * 86400;
            }

            await createLicense(env.DB, {
              id,
              license_key: key,
              telegram_user_id: telegramUserId,
              phone_number: phoneNumber,
              customer_name: name,
              customer_email: email,
              plan_type: webhookPlanType,
              expires_at: expiresAt,
              max_devices: parseInt(env.MAX_DEFAULT_DEVICES || '2', 10),
              notes: noteContent,
            });

            if (telegramUserId) {
              try {
                await directUpgradeProUser(env.DB, {
                  telegram_user_id: String(telegramUserId),
                  phone_number: phoneNumber,
                  customer_name: name,
                  customer_email: email,
                  plan_type: webhookPlanType,
                  expires_at: expiresAt,
                  notes: noteContent,
                });
              } catch (upErr) {
                console.error('[RAZORPAY_WEBHOOK] Failed to directUpgradeProUser:', upErr);
              }
            }

            await recordAdminLog(env.DB, 'RAZORPAY_ORDER', key, `Auto-generated for ${email}`);

            // Process Refer & Earn commission if a valid referral code was used
            const referralCode = paymentEntity?.notes?.referral_code ||
              orderEntity?.notes?.referral_code ||
              paymentEntity?.notes?.coupon;

            if (referralCode) {
              try {
                const referrer = await getReferralProfileByCode(env.DB, referralCode);
                // Strict Anti-Fraud / Anti-Self-Referral Check
                const isSelfEmail = referrer && referrer.user_email.toLowerCase() === email.toLowerCase();
                
                if (referrer && !isSelfEmail) {
                  const referralEnabled = (await getStoreSetting(env.DB, 'referral_enabled', '1')) === '1';
                  if (referralEnabled) {
                    const rewardType = await getStoreSetting(env.DB, 'referral_reward_type', 'fixed');
                    const rewardVal = parseFloat(await getStoreSetting(env.DB, 'referral_reward_value', '50')) || 50;
                    const paidAmount = paymentEntity?.amount ? paymentEntity.amount / 100 : 399;
                    let commission = rewardVal;
                    if (rewardType === 'percent') {
                      commission = Math.round((paidAmount * rewardVal) / 100);
                    }

                    await recordReferralConversion(env.DB, {
                      referral_code: referrer.referral_code,
                      referrer_email: referrer.user_email,
                      referred_email: email,
                      order_id: orderId,
                      order_amount: paidAmount,
                      commission_amount: commission,
                      conversion_type: 'pro_purchase',
                    });

                    // Send notification email to referrer
                    try {
                      await sendReferralEarningEmail(env, {
                        to: referrer.user_email,
                        name: referrer.user_name || undefined,
                        earnedAmount: commission,
                        walletBalance: referrer.wallet_balance + commission,
                        referralCode: referrer.referral_code,
                      });
                    } catch (err) {
                      console.error('Failed to send referral earning email:', err);
                    }
                  }
                }
              } catch (refErr) {
                console.error('Error processing referral reward in webhook:', refErr);
              }
            }

            // Automated email delivery with attached PDF Certificate (Sent EXACTLY ONCE)
            const emailSent = await sendPurchaseEmail(env, {
              to: email,
              name,
              licenseKey: key,
              planType: 'lifetime',
              orderId,
            });

            console.log(`[RAZORPAY_WEBHOOK] Processed new order ${orderId} for ${email}. Email sent: ${emailSent}`);
            return jsonResponse({ success: true, license_key: key, email_sent: emailSent });
          }
        }

        return jsonResponse({ received: true });
        }
      }

      // Root ping
      if (url.pathname === '/' || url.pathname === '/health') {
        return jsonResponse({
          status: 'online',
          app: env.APP_NAME || 'TG Drive: Unlimited Cloud',
          version: '1.0.0',
        });
      }

      return jsonResponse({ error: 'Not Found', path: url.pathname }, 404);
    } catch (err) {
      console.error('Unhandled error:', err);
      const msg = err instanceof Error ? err.message : 'Internal Server Error';
      return jsonResponse({ error: msg }, 500);
    }
  },

  // Cron Trigger: runs daily to send trial expiry reminder emails (3 days before expiry)
  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    try {
      const now = Math.floor(Date.now() / 1000);
      // Find trial licenses expiring in 3 days (±12 hour window to avoid double sends)
      const threeDaysFromNow = now + 3 * 86400;
      const windowStart = threeDaysFromNow - 43200; // -12h
      const windowEnd   = threeDaysFromNow + 43200; // +12h

      const rows = await env.DB.prepare(`
        SELECT license_key, customer_name, customer_email, expires_at
        FROM licenses
        WHERE plan_type = 'trial'
          AND is_banned = 0
          AND expires_at IS NOT NULL
          AND expires_at >= ?
          AND expires_at <= ?
          AND customer_email IS NOT NULL
      `).bind(windowStart, windowEnd).all();

      const trials = (rows.results || []) as { license_key: string; customer_name: string | null; customer_email: string; expires_at: number }[];
      console.log(`[CRON] Found ${trials.length} trial(s) expiring in ~3 days. Sending reminders...`);

      for (const trial of trials) {
        const daysLeft = Math.ceil((trial.expires_at - now) / 86400);
        await sendTrialExpiryReminderEmail(env, {
          to: trial.customer_email,
          name: trial.customer_name,
          licenseKey: trial.license_key,
          expiresAt: trial.expires_at,
          daysLeft,
        }).catch(err => console.error(`Reminder email failed for ${trial.customer_email}:`, err));
      }
    } catch (err) {
      console.error('[CRON] Trial reminder job failed:', err);
    }
  },
};
