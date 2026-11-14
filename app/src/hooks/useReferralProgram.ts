import { useState, useEffect, useCallback } from 'react';
import { openExternalUrl } from '../utils/url';
import { toast } from 'sonner';

export interface TelegramCachedUser {
  id: number | string;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  phone?: string | null;
  isPremium?: boolean;
}

export function getCachedTelegramUser(): TelegramCachedUser | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('tg_cached_user_profile') : null;
    return raw ? (JSON.parse(raw) as TelegramCachedUser) : null;
  } catch {
    return null;
  }
}

export interface ReferralProfile {
  id: string;
  referral_code: string;
  telegram_user_id?: string | null;
  telegram_username?: string | null;
  user_name: string | null;
  user_email?: string | null;
  total_clicks: number;
  total_referrals: number;
  total_pro_sales: number;
  total_earned: number;
  wallet_balance: number;
  pending_payout: number;
  total_paid: number;
  default_payout_method: string | null;
  default_upi_id: string | null;
  default_bank_name: string | null;
  default_bank_account: string | null;
  default_bank_ifsc: string | null;
  default_bank_holder: string | null;
}

export interface ReferralConversion {
  id: string;
  referral_code: string;
  referrer_telegram_user_id?: string | null;
  referred_telegram_user_id?: string | null;
  referred_username?: string | null;
  order_id?: string | null;
  order_amount: number;
  commission_amount: number;
  conversion_type: string;
  status: string;
  created_at: number;
}

export interface PayoutRequest {
  id: string;
  referral_code: string;
  telegram_user_id?: string | null;
  amount: number;
  payout_method: 'upi' | 'bank';
  upi_id: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_ifsc: string | null;
  bank_holder_name: string | null;
  status: 'pending' | 'completed' | 'rejected';
  admin_notes: string | null;
  utr_number: string | null;
  created_at: number;
  processed_at: number | null;
}

export interface ReferralSettings {
  min_payout: number;
  reward_type: string;
  reward_value: number;
  friend_discount_type: string;
  friend_discount_value: number;
}

export interface RequestPayoutParams {
  amount: number;
  payoutMethod: 'upi' | 'bank';
  upiId?: string;
  bankAccount?: string;
  bankIfsc?: string;
  bankHolder?: string;
  bankName?: string;
}

const API_BASE = 'https://tg-drive-license-service.baniarohan009.workers.dev';

export function useReferralProgram(
  initialTgUserId?: string | number,
  initialUsername?: string,
  initialName?: string
) {
  // Resolve Telegram account details directly from cache or passed parameters
  const cachedUser = getCachedTelegramUser();
  const telegramUserId = initialTgUserId ? String(initialTgUserId).trim() : (cachedUser?.id ? String(cachedUser.id) : '');
  const telegramUsername = initialUsername?.trim() || cachedUser?.username || '';
  const telegramName = initialName?.trim() || (cachedUser ? `${cachedUser.firstName} ${cachedUser.lastName || ''}`.trim() : 'Telegram User');

  const [profile, setProfile] = useState<ReferralProfile | null>(null);
  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [conversions, setConversions] = useState<ReferralConversion[]>([]);
  const [settings, setSettings] = useState<ReferralSettings>({
    min_payout: 100,
    reward_type: 'fixed',
    reward_value: 50,
    friend_discount_type: 'percent',
    friend_discount_value: 10,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [submittingPayout, setSubmittingPayout] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const fetchProfile = useCallback(async (customTgId?: string | number) => {
    const targetTgId = customTgId ? String(customTgId).trim() : telegramUserId;
    if (!targetTgId) return;

    setLoading(true);
    try {
      const url = `${API_BASE}/api/referral/profile?telegram_user_id=${encodeURIComponent(targetTgId)}&username=${encodeURIComponent(telegramUsername)}&name=${encodeURIComponent(telegramName)}&_t=${Date.now()}`;
      const res = await fetch(url);
      const data = (await res.json()) as {
        success?: boolean;
        profile?: ReferralProfile;
        payouts?: PayoutRequest[];
        conversions?: ReferralConversion[];
        settings?: ReferralSettings;
        error?: string;
      };

      if (res.ok && data.success && data.profile) {
        setProfile(data.profile);
        setPayouts(data.payouts || []);
        setConversions(data.conversions || []);
        if (data.settings) setSettings(data.settings);
      }
    } catch (err) {
      console.error('[Referral] Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [telegramUserId, telegramUsername, telegramName]);

  // Initial fetch on mount or account change
  useEffect(() => {
    if (telegramUserId) {
      void fetchProfile(telegramUserId);
    }
  }, [telegramUserId, fetchProfile]);

  const referralCode = profile?.referral_code || (telegramUsername ? `TG${telegramUsername.toUpperCase()}` : (telegramUserId ? `TG${telegramUserId.slice(-5)}` : 'TG-DRIVE'));
  const shareLink = `https://t.me/tg_drive_pro_bot?start=ref_${referralCode}`;
  const viralMessage = `⚡ Hey! Upgrade to TG Drive Lifetime Pro (Unlimited Cloud Storage backed by Telegram)!\n\nUse my Referral Code "${referralCode}" during plan purchase to get an instant ${settings.friend_discount_value}% OFF!\n\nGet Pro here: ${shareLink}`;

  const copyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success('Referral code copied!');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      toast.error('Could not copy code. Please copy manually.');
    }
  }, [referralCode]);

  const copyShareLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopiedLink(true);
      toast.success('Share link copied!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Could not copy link.');
    }
  }, [shareLink]);

  const copyPitchMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(viralMessage);
      toast.success('Promotional pitch copied!');
    } catch {
      toast.error('Could not copy pitch message.');
    }
  }, [viralMessage]);

  const shareWhatsApp = useCallback(() => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(viralMessage)}`;
    void openExternalUrl(url);
  }, [viralMessage]);

  const shareTelegram = useCallback(() => {
    const text = `⚡ Get ${settings.friend_discount_value}% OFF on TG Drive Lifetime Pro!\nApply Referral Code "${referralCode}" at checkout:\n${shareLink}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(text)}`;
    void openExternalUrl(url);
  }, [shareLink, settings.friend_discount_value, referralCode]);

  const shareTwitter = useCallback(() => {
    const tweet = `Get ${settings.friend_discount_value}% OFF TG Drive Unlimited Cloud! Enter referral code "${referralCode}" at checkout: ${shareLink}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`;
    void openExternalUrl(url);
  }, [referralCode, settings.friend_discount_value, shareLink]);

  const submitPayoutRequest = useCallback(async (params: RequestPayoutParams): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (!telegramUserId) {
      return { success: false, error: 'Telegram session required to withdraw.' };
    }

    if (params.amount < settings.min_payout) {
      return { success: false, error: `Minimum withdrawal amount is ₹${settings.min_payout}.` };
    }

    if (profile && params.amount > profile.wallet_balance) {
      return { success: false, error: `Insufficient wallet balance. Available: ₹${profile.wallet_balance.toFixed(0)}` };
    }

    if (params.payoutMethod === 'upi') {
      if (!params.upiId || !params.upiId.includes('@')) {
        return { success: false, error: 'Please enter a valid UPI ID (e.g. name@okaxis).' };
      }
    } else {
      if (!params.bankAccount || !params.bankIfsc || !params.bankHolder) {
        return { success: false, error: 'Please enter Account Number, IFSC, and Holder Name.' };
      }
    }

    setSubmittingPayout(true);
    try {
      const res = await fetch(`${API_BASE}/api/referral/request-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_user_id: telegramUserId,
          username: telegramUsername || undefined,
          name: telegramName || undefined,
          amount: params.amount,
          payout_method: params.payoutMethod,
          upi_id: params.payoutMethod === 'upi' ? params.upiId?.trim() : undefined,
          bank_account: params.payoutMethod === 'bank' ? params.bankAccount?.trim() : undefined,
          bank_ifsc: params.payoutMethod === 'bank' ? params.bankIfsc?.trim().toUpperCase() : undefined,
          bank_holder_name: params.payoutMethod === 'bank' ? params.bankHolder?.trim() : undefined,
          bank_name: params.payoutMethod === 'bank' ? params.bankName?.trim() : undefined,
        }),
      });

      const data = (await res.json()) as { success?: boolean; error?: string; message?: string };
      if (res.ok && data.success) {
        toast.success(data.message || 'Withdrawal request submitted!');
        void fetchProfile(telegramUserId);
        return { success: true, message: data.message || 'Withdrawal requested successfully.' };
      } else {
        const errMsg = data.error || 'Failed to submit withdrawal request.';
        toast.error(errMsg);
        return { success: false, error: errMsg };
      }
    } catch {
      const errNet = 'Network error. Please check your internet connection.';
      toast.error(errNet);
      return { success: false, error: errNet };
    } finally {
      setSubmittingPayout(false);
    }
  }, [telegramUserId, telegramUsername, telegramName, settings.min_payout, profile, fetchProfile]);

  return {
    telegramUserId,
    telegramUsername,
    telegramName,
    profile,
    payouts,
    conversions,
    settings,
    loading,
    submittingPayout,
    copiedCode,
    copiedLink,
    referralCode,
    shareLink,
    viralMessage,
    fetchProfile,
    copyCode,
    copyShareLink,
    copyPitchMessage,
    shareWhatsApp,
    shareTelegram,
    shareTwitter,
    submitPayoutRequest,
  };
}
