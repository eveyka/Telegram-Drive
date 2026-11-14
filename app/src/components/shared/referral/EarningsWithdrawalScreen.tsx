import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Building2,
  Clock,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  ArrowLeft,
  Coins,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { toast } from 'sonner';
import type {
  ReferralProfile,
  PayoutRequest,
  ReferralSettings,
  RequestPayoutParams,
} from '../../../hooks/useReferralProgram';

const defaultReferralSettings: ReferralSettings = {
  min_payout: 100,
  reward_type: 'flat',
  reward_value: 50,
  friend_discount_type: 'percent',
  friend_discount_value: 10,
};

export interface EarningsWithdrawalScreenProps {
  onClose?: () => void;
  onNavigateToReferral?: () => void;
  telegramUserId?: string;
  telegramUsername?: string;
  telegramName?: string;
  profile?: ReferralProfile | null;
  payouts?: PayoutRequest[];
  settings?: ReferralSettings;
  loading?: boolean;
  submittingPayout?: boolean;
  fetchProfile?: () => Promise<void>;
  submitPayoutRequest?: (params: RequestPayoutParams) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export const EarningsWithdrawalScreen: React.FC<EarningsWithdrawalScreenProps> = ({
  onNavigateToReferral,
  telegramUserId,
  telegramUsername,
  telegramName,
  profile,
  payouts = [],
  settings = defaultReferralSettings,
  loading = false,
  submittingPayout = false,
  fetchProfile = async () => {},
  submitPayoutRequest = async () => ({ success: false, error: 'Payout failed' }),
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [payoutMethod, setPayoutMethod] = useState<'upi' | 'bank'>('upi');
  const [upiId, setUpiId] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [confirmBankAccount, setConfirmBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'completed' | 'pending' | 'rejected'>('all');

  const walletBalance = profile?.wallet_balance ?? 0;
  const minPayout = settings.min_payout || 100;

  // Pre-fill defaults from profile if available
  useEffect(() => {
    if (profile) {
      if (profile.default_upi_id && !upiId) setUpiId(profile.default_upi_id);
      if (profile.default_bank_account && !bankAccount) {
        setBankAccount(profile.default_bank_account);
        setConfirmBankAccount(profile.default_bank_account);
      }
      if (profile.default_bank_ifsc && !bankIfsc) setBankIfsc(profile.default_bank_ifsc);
      if (profile.default_bank_holder && !bankHolder) setBankHolder(profile.default_bank_holder);
      if (profile.default_bank_name && !bankName) setBankName(profile.default_bank_name);
    }
  }, [profile]);

  const handleQuickAmount = (val: number) => {
    setWithdrawAmount(String(Math.min(walletBalance, val)));
    setFormError(null);
  };

  const handleMaxAmount = () => {
    setWithdrawAmount(String(Math.floor(walletBalance)));
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = parseFloat(withdrawAmount);
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }
    if (amountNum < minPayout) {
      setFormError(`Minimum withdrawal is ₹${minPayout}.`);
      return;
    }
    if (amountNum > walletBalance) {
      setFormError(`Insufficient balance. Maximum you can withdraw is ₹${walletBalance.toFixed(0)}.`);
      return;
    }

    if (payoutMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        setFormError('Please enter a valid UPI ID (e.g. name@okaxis).');
        return;
      }
    } else {
      if (!bankAccount.trim() || bankAccount.length < 8) {
        setFormError('Please enter a valid Bank Account Number.');
        return;
      }
      if (bankAccount !== confirmBankAccount) {
        setFormError('Account numbers do not match.');
        return;
      }
      if (!bankIfsc.trim() || bankIfsc.length < 10) {
        setFormError('Please enter a valid 11-character IFSC Code.');
        return;
      }
      if (!bankHolder.trim()) {
        setFormError('Please enter the Account Holder Name.');
        return;
      }
    }

    const res = await submitPayoutRequest({
      amount: amountNum,
      payoutMethod,
      upiId: payoutMethod === 'upi' ? upiId.trim() : undefined,
      bankAccount: payoutMethod === 'bank' ? bankAccount.trim() : undefined,
      bankIfsc: payoutMethod === 'bank' ? bankIfsc.trim().toUpperCase() : undefined,
      bankHolder: payoutMethod === 'bank' ? bankHolder.trim() : undefined,
      bankName: payoutMethod === 'bank' ? bankName.trim() : undefined,
    });

    if (res.success) {
      setWithdrawAmount('');
      void fetchProfile();
    }
  };

  const copyUtr = (utr: string) => {
    void navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    toast.success('UTR Number copied!');
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const filteredPayouts = payouts.filter((p) => {
    if (historyFilter === 'all') return true;
    return p.status === historyFilter;
  });

  return (
    <div className="flex flex-col gap-4 text-app-text max-w-xl mx-auto pb-6">
      {/* 1. Header with back link & Wallet Overview */}
      <div className="flex items-center justify-between">
        {onNavigateToReferral && (
          <button
            onClick={onNavigateToReferral}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-app-text-muted hover:text-telegram-primary transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Referral Code & Link</span>
          </button>
        )}
        <div className="flex items-center gap-2 text-[11px] text-app-text-muted">
          {loading && <Loader2 className="w-3 h-3 animate-spin text-telegram-primary" />}
          <span>
            {telegramUsername ? `@${telegramUsername}` : (telegramName || 'TG')}
            {telegramUserId ? ` (${telegramUserId})` : ''}
          </span>
        </div>
      </div>

      {/* 2. Wallet Card */}
      <div className={`p-4 rounded-2xl border ${
        isLight
          ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-200 shadow-sm'
          : 'bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border-emerald-500/30 shadow-lg'
      }`}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 block mb-0.5">
              Available Cash Balance
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 flex items-center gap-1">
              <span>₹{walletBalance.toFixed(0)}</span>
            </div>
            <p className="text-[11px] text-app-text-muted mt-0.5">
              Min withdrawal ₹{minPayout} • 0% Transfer Fee
            </p>
          </div>

          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        {/* Micro stats strip */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20">
          <div>
            <span className="text-[10px] text-app-text-muted block">Total Earned</span>
            <span className="text-xs font-bold text-app-text">
              ₹{profile?.total_earned ? profile.total_earned.toFixed(0) : '0'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-app-text-muted block">Paid Out</span>
            <span className="text-xs font-bold text-blue-400">
              ₹{profile?.total_paid ? profile.total_paid.toFixed(0) : '0'}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-app-text-muted block">Pending</span>
            <span className="text-xs font-bold text-amber-400">
              ₹{profile?.pending_payout ? profile.pending_payout.toFixed(0) : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Withdrawal Form Card */}
      <div className={`p-4 rounded-xl border ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-app-text mb-3 flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-telegram-primary" />
          Request Cash Withdrawal
        </h3>

        {/* Payout method selector */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            type="button"
            onClick={() => { setPayoutMethod('upi'); setFormError(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
              payoutMethod === 'upi'
                ? 'bg-telegram-primary text-white border-telegram-primary shadow-sm'
                : 'bg-slate-800/40 text-app-text-muted border-slate-700/60 hover:text-app-text'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>UPI (Instant)</span>
          </button>

          <button
            type="button"
            onClick={() => { setPayoutMethod('bank'); setFormError(null); }}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
              payoutMethod === 'bank'
                ? 'bg-telegram-primary text-white border-telegram-primary shadow-sm'
                : 'bg-slate-800/40 text-app-text-muted border-slate-700/60 hover:text-app-text'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank Transfer</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Amount input & quick chips */}
          <div>
            <label className="text-[11px] font-semibold text-app-text-muted block mb-1">
              Withdrawal Amount (₹)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-app-text-muted">
                ₹
              </span>
              <input
                type="number"
                min={minPayout}
                max={walletBalance}
                step="1"
                placeholder={`Min ₹${minPayout}`}
                value={withdrawAmount}
                onChange={(e) => { setWithdrawAmount(e.target.value); setFormError(null); }}
                className={`w-full pl-7 pr-3 py-2 rounded-lg text-xs font-bold border outline-none transition-colors ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-telegram-primary'
                    : 'bg-slate-950/80 border-slate-700 text-white focus:border-telegram-primary'
                }`}
              />
            </div>

            {/* Quick chips */}
            {walletBalance >= minPayout && (
              <div className="flex items-center gap-1.5 mt-2">
                {[100, 250, 500].filter(v => v <= walletBalance).map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800/60 hover:bg-slate-700 border border-slate-700 text-app-text-muted hover:text-app-text"
                  >
                    ₹{val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleMaxAmount}
                  className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-400"
                >
                  Max (₹{walletBalance.toFixed(0)})
                </button>
              </div>
            )}
          </div>

          {/* UPI Form */}
          {payoutMethod === 'upi' ? (
            <div>
              <label className="text-[11px] font-semibold text-app-text-muted block mb-1">
                UPI ID (Google Pay, PhonePe, Paytm, BHIM)
              </label>
              <input
                type="text"
                placeholder="e.g. mobile@okaxis or name@paytm"
                value={upiId}
                onChange={(e) => { setUpiId(e.target.value); setFormError(null); }}
                className={`w-full px-3 py-2 rounded-lg text-xs border outline-none transition-colors ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 focus:border-telegram-primary'
                    : 'bg-slate-950/80 border-slate-700 text-white focus:border-telegram-primary'
                }`}
              />
            </div>
          ) : (
            /* Bank Form */
            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-semibold text-app-text-muted block mb-1">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  placeholder="Enter Account Number"
                  value={bankAccount}
                  onChange={(e) => { setBankAccount(e.target.value); setFormError(null); }}
                  className={`w-full px-3 py-2 rounded-lg text-xs border outline-none transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-telegram-primary'
                      : 'bg-slate-950/80 border-slate-700 text-white focus:border-telegram-primary'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-app-text-muted block mb-1">
                  Confirm Account Number
                </label>
                <input
                  type="text"
                  placeholder="Re-enter Account Number"
                  value={confirmBankAccount}
                  onChange={(e) => { setConfirmBankAccount(e.target.value); setFormError(null); }}
                  className={`w-full px-3 py-2 rounded-lg text-xs border outline-none transition-colors ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900 focus:border-telegram-primary'
                      : 'bg-slate-950/80 border-slate-700 text-white focus:border-telegram-primary'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-app-text-muted block mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0001234"
                    value={bankIfsc}
                    onChange={(e) => { setBankIfsc(e.target.value.toUpperCase()); setFormError(null); }}
                    className={`w-full px-3 py-2 rounded-lg text-xs uppercase font-mono border outline-none transition-colors ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-telegram-primary'
                        : 'bg-slate-950/80 border-slate-700 text-white focus:border-telegram-primary'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-app-text-muted block mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    placeholder="As per bank"
                    value={bankHolder}
                    onChange={(e) => { setBankHolder(e.target.value); setFormError(null); }}
                    className={`w-full px-3 py-2 rounded-lg text-xs border outline-none transition-colors ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-telegram-primary'
                        : 'bg-slate-950/80 border-slate-700 text-white focus:border-telegram-primary'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submittingPayout || walletBalance < minPayout}
            className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
              walletBalance < minPayout
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.99]'
            }`}
          >
            {submittingPayout ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Processing Request...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Submit Withdrawal Request</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 4. Payout History */}
      <div className={`p-4 rounded-xl border ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-app-text flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Payout History ({payouts.length})
          </h3>

          {/* Filter chips */}
          <div className="flex items-center gap-1">
            {(['all', 'pending', 'completed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setHistoryFilter(filter)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-colors ${
                  historyFilter === filter
                    ? 'bg-telegram-primary text-white'
                    : 'text-app-text-muted hover:text-app-text'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {filteredPayouts.length > 0 ? (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {filteredPayouts.map((payout) => {
              const dateStr = payout.created_at
                ? new Date(payout.created_at * 1000).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Recent';

              const isCompleted = payout.status === 'completed';
              const isPending = payout.status === 'pending';

              return (
                <div
                  key={payout.id}
                  className={`p-2.5 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-sm text-app-text">
                      ₹{payout.amount.toFixed(0)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isCompleted
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : isPending
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {payout.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-app-text-muted">
                    <span>
                      {payout.payout_method === 'upi' ? `UPI: ${payout.upi_id}` : `Bank: ••••${(payout.bank_account || '').slice(-4)}`}
                    </span>
                    <span>{dateStr}</span>
                  </div>

                  {payout.utr_number && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px]">
                      <span className="text-app-text-muted font-mono">
                        UTR: {payout.utr_number}
                      </span>
                      <button
                        onClick={() => copyUtr(payout.utr_number!)}
                        className="text-telegram-primary hover:underline flex items-center gap-1 font-semibold"
                      >
                        {copiedUtr === payout.utr_number ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedUtr === payout.utr_number ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 text-app-text-muted">
            <p className="text-xs font-medium">No withdrawal requests yet</p>
            <p className="text-[10px] text-app-text-muted/80 mt-0.5">
              Earnings from referred Pro purchases will appear here for payout.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
