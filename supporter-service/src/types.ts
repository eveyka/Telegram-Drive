export type LicensePlan = 'lifetime' | 'annual' | 'monthly' | 'trial';
export type DevicePlatform = 'windows' | 'android' | 'ios' | 'macos' | 'linux' | 'web' | 'other';

export interface ProUserRow {
  id: string;
  telegram_user_id: string;
  phone_number?: string | null;
  first_name?: string | null;
  username?: string | null;
  plan_type: LicensePlan;
  is_pro: number;
  is_banned: number;
  ban_reason?: string | null;
  notes?: string | null;
  created_at: number;
  expires_at?: number | null;
  last_active_at?: number | null;
}

export interface PaymentTransactionRow {
  id: string;
  order_id: string;
  payment_id?: string | null;
  telegram_user_id: string;
  phone_number?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  plan_type: LicensePlan;
  amount: number; // In paise (e.g. 39900 for Rs 399)
  currency: string;
  status: 'created' | 'paid' | 'failed' | 'refunded';
  payment_method?: string | null;
  signature?: string | null;
  created_at: number;
  paid_at?: number | null;
}

export interface BotSubscriberRow {
  telegram_user_id: string;
  chat_id: string;
  username?: string | null;
  first_name?: string | null;
  subscribed_at: number;
  is_active: number;
}

export interface DeviceActivationRow {
  id: string;
  license_key: string;
  hardware_id: string;
  device_name: string;
  platform: DevicePlatform;
  activated_at: number;
  last_seen_at: number;
  is_revoked: number;
}

export interface LicenseClaims {
  sub: string; // telegram user id
  hwid?: string;
  tg_id?: string;
  phone?: string;
  plan: LicensePlan;
  exp: number | null;
  iat: number;
  iss: string;
  name?: string;
}

export interface Env {
  DB: D1Database;
  APP_NAME?: string;
  STORE_URL?: string;
  ADMIN_SECRET?: string;
  SIGNING_PRIVATE_KEY?: string;
  SIGNING_PUBLIC_KEY?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  TELEGRAM_BOT_TOKEN?: string;
  MAX_DEFAULT_DEVICES?: string;
  LEMON_SQUEEZY_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  GMAIL_USER?: string;
  GMAIL_APP_PASSWORD?: string;
}

export interface CreateRazorpayOrderRequest {
  telegram_user_id: string | number;
  phone_number?: string;
  customer_name?: string;
  customer_email?: string;
  plan_type?: LicensePlan;
  amount?: number;
}

export interface VerifyRazorpayPaymentRequest {
  order_id: string;
  payment_id: string;
  signature: string;
  telegram_user_id: string | number;
  phone_number?: string;
  customer_name?: string;
  customer_email?: string;
  plan_type?: LicensePlan;
}

export interface BroadcastMessageRequest {
  message: string;
  parse_mode?: 'Markdown' | 'HTML';
  button_text?: string;
  button_url?: string;
  target_user_id?: string;
}

// Retain legacy interface for backward compatibility
export interface LicenseRow {
  id: string;
  license_key: string;
  telegram_user_id?: string | null;
  phone_number?: string | null;
  customer_name: string | null;
  customer_email: string | null;
  plan_type: LicensePlan;
  max_devices: number;
  is_banned: number;
  ban_reason: string | null;
  notes: string | null;
  created_at: number;
  expires_at: number | null;
}

export interface ActivationRequest {
  license_key: string;
  hardware_id: string;
  device_name?: string;
  platform?: DevicePlatform;
  telegram_user_id?: string;
  phone_number?: string;
}

export interface CreateLicenseRequest {
  license_key?: string;
  telegram_user_id?: string;
  phone_number?: string;
  customer_name?: string;
  customer_email?: string;
  plan_type?: LicensePlan;
  max_devices?: number;
  notes?: string;
  expires_at?: number | null;
}

export interface DeactivateRequest {
  license_key: string;
  hardware_id: string;
}

export interface RequestOtpRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface SelfResetDeviceRequest {
  email: string;
  license_key: string;
  hardware_id?: string;
  session_token?: string;
}

export interface VerifyRequest {
  token?: string;
  license_key?: string;
  hardware_id?: string;
}

export interface CheckAccountRequest {
  telegram_user_id?: string;
  phone_number?: string;
}

export interface AccountStatusResponse {
  active: boolean;
  is_pro?: boolean;
  plan_type?: LicensePlan;
  customer_name?: string | null;
  customer_email?: string | null;
  expires_at?: number | null;
  token?: string;
  terms_version: string;
  message?: string;
}

export interface CrashReportRow {
  id: string;
  app_version: string;
  source: string;
  error_type: string;
  frames: string;
  platform: string;
  occurred_at: string;
  created_at: number;
}
