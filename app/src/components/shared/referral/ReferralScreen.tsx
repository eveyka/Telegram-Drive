import React, { useState } from 'react';
import {
  Copy,
  Check,
  Send,
  Sparkles,
  QrCode,
  HelpCircle,
  TrendingUp,
  Wallet,
  ChevronDown,
  Gift,
  CheckCircle2,
  Users,
  ShieldCheck,
  ArrowUpRight,
  Share2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTheme } from '../../../context/ThemeContext';
import type {
  ReferralProfile,
  ReferralConversion,
  ReferralSettings,
} from '../../../hooks/useReferralProgram';

const defaultReferralSettings: ReferralSettings = {
  min_payout: 100,
  reward_type: 'flat',
  reward_value: 50,
  friend_discount_type: 'percent',
  friend_discount_value: 10,
};

export interface ReferralScreenProps {
  onClose?: () => void;
  onNavigateToEarnings?: () => void;
  telegramUserId?: string;
  telegramUsername?: string;
  telegramName?: string;
  profile?: ReferralProfile | null;
  conversions?: ReferralConversion[];
  settings?: ReferralSettings;
  copiedCode?: boolean;
  copiedLink?: boolean;
  referralCode?: string;
  shareLink?: string;
  copyCode?: () => Promise<void>;
  copyShareLink?: () => Promise<void>;
  copyPitchMessage?: () => Promise<void>;
  shareWhatsApp?: () => void;
  shareTelegram?: () => void;
  shareTwitter?: () => void;
  fetchProfile?: () => Promise<void>;
}

export const ReferralScreen: React.FC<ReferralScreenProps> = ({
  onNavigateToEarnings,
  telegramUserId,
  telegramUsername,
  telegramName,
  profile,
  conversions = [],
  settings = defaultReferralSettings,
  copiedCode = false,
  copiedLink = false,
  referralCode = '',
  shareLink = '',
  copyCode = async () => {},
  copyShareLink = async () => {},
  copyPitchMessage = async () => {},
  shareWhatsApp = () => {},
  shareTelegram = () => {},
  fetchProfile = async () => {},
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [showQrCode, setShowQrCode] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const activeReferralCode = referralCode || profile?.referral_code || 'TG-PRO';
  const activeShareLink = shareLink || `https://t.me/tg_drive_pro_bot?start=ref_${activeReferralCode}`;
  const rewardAmount = settings.reward_value || 50;
  const discountPercent = settings.friend_discount_value || 10;

  const faqs = [
    {
      q: 'How does my friend use my Referral Code?',
      a: `When your friend chooses a TG Drive Pro plan and clicks "Have a Coupon or Referral Code?", they enter your code to get ${discountPercent}% instant discount.`,
    },
    {
      q: 'When do I get my ₹50 reward?',
      a: `Your wallet is credited instantly as soon as your friend completes their Pro plan payment. Free trials or incomplete payments do not credit reward.`,
    },
    {
      q: 'How do I withdraw my earnings?',
      a: `Tap "Withdraw" in your wallet to transfer money directly to your UPI ID (Google Pay, PhonePe, Paytm) or Bank Account once your balance reaches ₹${settings.min_payout}.`,
    },
    {
      q: 'Can I refer my own account?',
      a: 'No, self-referrals are prevented automatically. Share your code with friends, communities, and Telegram groups.',
    },
  ];

  return (
    <div className="flex flex-col gap-4 text-app-text max-w-xl mx-auto pb-6">
      {/* 1. Account Identity Badge (Zero Email, 100% Telegram) */}
      <div className={`flex items-center justify-between p-2.5 rounded-xl border ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-telegram-primary/20 border border-telegram-primary/40 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-telegram-primary">
              {(telegramUsername || telegramName || 'TG').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold truncate">
                {telegramUsername ? `@${telegramUsername}` : (telegramName || 'Telegram User')}
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
            {telegramUserId && (
              <p className="text-[10px] text-app-text-muted truncate">
                TG ID: {telegramUserId}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => void fetchProfile()}
          className="text-[11px] text-app-text-muted hover:text-telegram-primary px-2 py-1 rounded-lg transition-colors border border-transparent hover:border-slate-700/50"
        >
          Refresh
        </button>
      </div>

      {/* 2. Referral Code Hero Card */}
      <div className={`relative overflow-hidden rounded-2xl border p-4.5 ${
        isLight
          ? 'bg-gradient-to-br from-indigo-50 via-purple-50/50 to-white border-indigo-200/80 shadow-sm'
          : 'bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-950/80 border-indigo-500/30 shadow-lg shadow-indigo-950/20'
      }`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 mb-1.5">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Referral Program
            </div>
            <h2 className="text-sm sm:text-base font-extrabold tracking-tight">
              Earn ₹{rewardAmount} per Pro Upgrade
            </h2>
            <p className="text-xs text-app-text-muted mt-0.5">
              Give friends {discountPercent}% OFF • Earn ₹{rewardAmount} cash on verified purchase
            </p>
          </div>

          <button
            onClick={() => setShowQrCode((prev) => !prev)}
            className={`p-1.5 rounded-lg border transition-all ${
              showQrCode
                ? 'bg-indigo-500 text-white border-indigo-400'
                : 'bg-slate-800/40 border-slate-700/60 text-app-text-muted hover:text-app-text'
            }`}
            title="Toggle QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code expansion */}
        {showQrCode && (
          <div className="flex flex-col items-center justify-center p-3 my-2.5 rounded-xl bg-white text-slate-900 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <QRCodeSVG value={activeShareLink} size={130} />
            <p className="text-[10px] text-slate-500 font-mono mt-1.5">
              Scan to redeem code & discount
            </p>
          </div>
        )}

        {/* Monospace Code Display */}
        <div className={`flex items-center justify-between p-2.5 rounded-xl border mb-3 ${
          isLight ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}>
          <div className="min-w-0 pr-2">
            <span className="text-[10px] uppercase font-semibold text-app-text-muted block">
              Your Referral Code
            </span>
            <span className="text-base sm:text-lg font-mono font-black tracking-widest text-indigo-400 truncate block">
              {activeReferralCode}
            </span>
          </div>

          <button
            onClick={() => void copyCode()}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-sm ${
              copiedCode
                ? 'bg-emerald-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'
            }`}
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Compact Share Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={shareTelegram}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 border border-sky-500/30 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram</span>
          </button>

          <button
            onClick={shareWhatsApp}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 transition-all active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={() => void copyShareLink()}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/30 transition-all active:scale-95"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Copied' : 'Link'}</span>
          </button>

          <button
            onClick={() => void copyPitchMessage()}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/30 transition-all active:scale-95"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Pitch</span>
          </button>
        </div>
      </div>

      {/* 3. Three-Card Micro Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center gap-1.5 text-app-text-muted mb-1">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-medium">Upgrades</span>
          </div>
          <p className="text-base sm:text-lg font-black text-app-text">
            {profile?.total_pro_sales ?? 0}
          </p>
          <span className="text-[10px] text-app-text-muted">Paid referrals</span>
        </div>

        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
        }`}>
          <div className="flex items-center gap-1.5 text-app-text-muted mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] font-medium">Earned</span>
          </div>
          <p className="text-base sm:text-lg font-black text-indigo-400">
            ₹{profile?.total_earned ? profile.total_earned.toFixed(0) : '0'}
          </p>
          <span className="text-[10px] text-app-text-muted">Lifetime cash</span>
        </div>

        <div className={`p-3 rounded-xl border ${
          isLight ? 'bg-indigo-50/50 border-indigo-200' : 'bg-indigo-950/20 border-indigo-500/30'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-app-text-muted">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-medium">Wallet</span>
            </div>
          </div>
          <p className="text-base sm:text-lg font-black text-emerald-400">
            ₹{profile?.wallet_balance ? profile.wallet_balance.toFixed(0) : '0'}
          </p>
          {onNavigateToEarnings && (
            <button
              onClick={onNavigateToEarnings}
              className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-telegram-primary hover:underline"
            >
              Withdraw <ArrowUpRight className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Structured 3-Step Systematic Flow */}
      <div className={`p-3.5 rounded-xl border ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'
      }`}>
        <h3 className="text-xs font-bold text-app-text uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          How It Works (Systematic & Secure)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className={`p-2.5 rounded-lg border text-left ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-[10px] inline-flex items-center justify-center mb-1">
              1
            </span>
            <p className="text-xs font-bold">Share Code</p>
            <p className="text-[11px] text-app-text-muted mt-0.5 leading-snug">
              Friend enters your code at Pro plan purchase.
            </p>
          </div>

          <div className={`p-2.5 rounded-lg border text-left ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] inline-flex items-center justify-center mb-1">
              2
            </span>
            <p className="text-xs font-bold">{discountPercent}% OFF</p>
            <p className="text-[11px] text-app-text-muted mt-0.5 leading-snug">
              Instant discount applied to their order.
            </p>
          </div>

          <div className={`p-2.5 rounded-lg border text-left ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'
          }`}>
            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-[10px] inline-flex items-center justify-center mb-1">
              3
            </span>
            <p className="text-xs font-bold">₹{rewardAmount} Credited</p>
            <p className="text-[11px] text-app-text-muted mt-0.5 leading-snug">
              Credited instantly on verified payment.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Real-Time Verified Conversions List */}
      <div className={`p-3.5 rounded-xl border ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-app-text uppercase tracking-wider flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-purple-400" />
            Verified Referral Rewards ({conversions.length})
          </h3>
          {onNavigateToEarnings && (
            <button
              onClick={onNavigateToEarnings}
              className="text-[11px] font-semibold text-telegram-primary hover:underline"
            >
              Wallet & History
            </button>
          )}
        </div>

        {conversions.length > 0 ? (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {conversions.map((conv) => {
              const dateStr = conv.created_at
                ? new Date(conv.created_at * 1000).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })
                : 'Recent';

              return (
                <div
                  key={conv.id}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold truncate text-[11px]">
                        {conv.referred_username ? `@${conv.referred_username}` : `Telegram User #${(conv.referred_telegram_user_id || '').slice(-4)}`}
                      </p>
                      <p className="text-[10px] text-app-text-muted">{dateStr} • Pro Upgrade</p>
                    </div>
                  </div>

                  <span className="font-extrabold text-emerald-400 text-xs shrink-0">
                    +₹{conv.commission_amount.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-app-text-muted">
            <p className="text-xs font-medium">No verified referrals yet</p>
            <p className="text-[10px] text-app-text-muted/80 mt-0.5">
              Share your code. Reward credits automatically when a friend purchases Pro!
            </p>
          </div>
        )}
      </div>

      {/* 6. Systematic FAQ Accordion */}
      <div className={`p-3.5 rounded-xl border ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-800/80'
      }`}>
        <h3 className="text-xs font-bold text-app-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          Frequently Asked Questions
        </h3>

        <div className="divide-y divide-slate-800/60">
          {faqs.map((faq, index) => {
            const isExpanded = expandedFaq === index;
            return (
              <div key={index} className="py-2 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : index)}
                  className="w-full flex items-center justify-between text-left text-xs font-semibold hover:text-telegram-primary transition-colors gap-2"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180 text-telegram-primary' : 'text-app-text-muted'
                    }`}
                  />
                </button>
                {isExpanded && (
                  <p className="text-[11px] text-app-text-muted mt-1 leading-relaxed animate-in fade-in duration-150">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
