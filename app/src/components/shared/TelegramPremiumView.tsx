import React, { useState, useMemo } from 'react';
import {
  Circle,
  ChevronRight,
  Folder,
  Zap,
  CloudUpload,
  ShieldCheck,
  MegaphoneOff,
  Smartphone,
  Crown,
  Tag,
  Loader2,
  X,
  Sparkles,
  RefreshCw,
  HelpCircle,
  Check,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { licenseManager, type LicenseInfo, type LicensePlan, type StorePlan, type StoreConfig } from '../../services/licenseManager';

interface TelegramPremiumViewProps {
  onBack?: () => void;
  mobileLicense: LicenseInfo | null;
  setMobileLicense: (license: LicenseInfo | null) => void;
  liveStoreConfig: StoreConfig | null;
  userProfile?: { id?: string | number; firstName?: string | null; lastName?: string | null; phone?: string | null; username?: string | null } | null;
  onShowHelp?: () => void;
  onContactDeveloper?: () => void;
  onSyncLicense?: () => Promise<void>;
  isLicenseSyncing?: boolean;
}

interface FeatureItem {
  id: string;
  title: string;
  subtitle: string;
  iconBg: string;
  icon: React.ReactNode;
  badge?: string;
  detailTitle: string;
  detailPoints: { title: string; desc: string }[];
}

const PREMIUM_FEATURES: FeatureItem[] = [
  {
    id: 'folders',
    title: 'Unlimited Custom Folders',
    subtitle: 'Create unlimited cloud channels & folders, smart categorisation and organization.',
    iconBg: 'bg-gradient-to-tr from-[#F59E0B] to-[#D97706]',
    icon: <Folder className="w-5 h-5 text-white fill-white/20" />,
    badge: 'UNLIMITED',
    detailTitle: 'Unlimited Cloud Folders',
    detailPoints: [
      { title: 'Unlimited Folder Creation', desc: 'Create and organize unlimited custom folders for movies, photos, and projects.' },
      { title: 'Smart Auto-Categorization', desc: 'Sort files automatically into dedicated media, document, and archive channels.' },
      { title: 'Bulk File Move', desc: 'Batch relocate dozens of files between folders instantly.' },
      { title: 'Public & Private Channels', desc: 'Export channel invite links to easily share whole folders.' },
    ],
  },
  {
    id: 'speed',
    title: '10x Turbo Transfer Speed',
    subtitle: 'Parallel MTProto chunk streaming up to 100 MB/s without throttling.',
    iconBg: 'bg-gradient-to-tr from-[#EF4444] to-[#DC2626]',
    icon: <Zap className="w-5 h-5 text-white fill-white/20" />,
    badge: '100 MB/s',
    detailTitle: 'Turbo Transfer Engine',
    detailPoints: [
      { title: '100 MB/s Dynamic Pipeline', desc: 'Multi-threaded parallel chunk streaming maximizing Telegram server throughput.' },
      { title: 'Zero Bandwidth Throttling', desc: 'Upload and download high-bitrate 4K movies and large ZIP archives at peak speeds.' },
      { title: 'Priority Thread Allocation', desc: 'Transfers get assigned to high-performance parallel connection queues.' },
      { title: 'Resumable Chunk Buffering', desc: 'Network interruptions automatically resume without restarting downloads.' },
    ],
  },
  {
    id: 'backup',
    title: 'Automated Cloud Backup',
    subtitle: 'Automatic background sync for photos, videos, audio, and documents.',
    iconBg: 'bg-gradient-to-tr from-[#0284C7] to-[#0369A1]',
    icon: <CloudUpload className="w-5 h-5 text-white fill-white/20" />,
    badge: 'AUTO SYNC',
    detailTitle: 'Automated Cloud Backup',
    detailPoints: [
      { title: 'Background Media Sync', desc: 'Automatically backs up newly taken photos and downloaded videos to Telegram.' },
      { title: 'Wi-Fi & Battery Optimized', desc: 'Syncs when plugged in and connected to Wi-Fi to preserve mobile battery.' },
      { title: 'Zero Storage Limitations', desc: 'Preserves phone internal storage by offloading original media.' },
      { title: 'Instant Multi-Device Sync', desc: 'Access backed up media instantly from any phone, tablet, or desktop.' },
    ],
  },
  {
    id: 'encryption',
    title: 'TDENC2 Encrypted Vault',
    subtitle: 'Hardware-grade AEAD encryption on device before sending to Telegram.',
    iconBg: 'bg-gradient-to-tr from-[#9333EA] to-[#7E22CE]',
    icon: <ShieldCheck className="w-5 h-5 text-white fill-white/20" />,
    badge: 'ZERO-KNOWLEDGE',
    detailTitle: 'Zero-Knowledge Security',
    detailPoints: [
      { title: 'Client-Side AES-256-GCM', desc: 'Files are encrypted on your device with authenticated AEAD cryptography.' },
      { title: 'Hardware Keystore Security', desc: 'Keys are protected by device Secure Enclave and Hardware Keystore.' },
      { title: 'Biometric App Lock', desc: 'Lock the app and private folders with fingerprint or face biometric authentication.' },
      { title: 'Zero Intermediary Access', desc: 'Only you possess the passphrase. No server ever sees unencrypted files.' },
    ],
  },
  {
    id: 'ads',
    title: '100% Ad-Free Experience',
    subtitle: 'Clean, distraction-free interface with zero third-party banners or delays.',
    iconBg: 'bg-gradient-to-tr from-[#E11D48] to-[#BE123C]',
    icon: <MegaphoneOff className="w-5 h-5 text-white fill-white/20" />,
    badge: 'AD-FREE',
    detailTitle: '100% Ad-Free Experience',
    detailPoints: [
      { title: 'Zero Advertisements', desc: 'Eliminate all sponsored cards, popups, and third-party banners completely.' },
      { title: 'Faster Page Rendering', desc: 'Pages load faster without loading tracking scripts or ad networks.' },
      { title: 'Uninterrupted File Operations', desc: 'No sponsor cooldowns or delays when downloading or sharing files.' },
      { title: 'Direct Development Support', desc: 'Your support funds independent server bandwidth and development.' },
    ],
  },
  {
    id: 'binding',
    title: 'Cross-Device Account Binding',
    subtitle: 'Pro automatically activates across Android, iOS, Windows, Mac, and WebDAV.',
    iconBg: 'bg-gradient-to-tr from-[#4F46E5] to-[#4338CA]',
    icon: <Smartphone className="w-5 h-5 text-white fill-white/20" />,
    badge: 'MULTI-DEVICE',
    detailTitle: 'Multi-Device Account Binding',
    detailPoints: [
      { title: 'Bound to Telegram Account', desc: 'Log in on any phone, tablet, or computer and your Pro license activates automatically.' },
      { title: 'Desktop App Integration', desc: 'Full Pro features on Windows, macOS, and Linux desktop builds.' },
      { title: 'WebDAV Cloud Drive Mount', desc: 'Mount your Telegram cloud as a local disk drive via WebDAV.' },
      { title: 'Zero Key Loss Risk', desc: 'No complicated license keys to memorize; bound to your phone number and Telegram ID.' },
    ],
  },
];

const DEFAULT_STORE_PLANS: StorePlan[] = [
  {
    id: 'lifetime',
    name: 'Lifetime Pro Access',
    price: 499,
    original_price: 1499,
    formatted_price: '₹499.00',
    formatted_original_price: '₹1,499.00',
    discount_percent: 67,
    badge: '67% OFF',
    description: 'Pay once, access forever',
    features: ['All Pro features', 'No renewals', 'Permanent access'],
  },
  {
    id: 'annual',
    name: '1-Year Annual Pass',
    price: 199,
    original_price: 599,
    formatted_price: '₹199.00',
    formatted_original_price: '₹599.00',
    discount_percent: 67,
    badge: '67% OFF',
    description: 'Billed annually',
    duration_days: 365,
    features: ['17/month equivalent', 'Cancel anytime before renewal'],
  },
  {
    id: 'monthly',
    name: '1-Month Pass',
    price: 49,
    original_price: 99,
    formatted_price: '₹49.00',
    formatted_original_price: '₹99.00',
    discount_percent: 51,
    badge: '51% OFF',
    description: 'Flexible, cancel anytime',
    duration_days: 30,
    features: ['Short-term access', 'Paid monthly'],
  },
];

export const TelegramPremiumView: React.FC<TelegramPremiumViewProps> = ({
  mobileLicense,
  setMobileLicense,
  liveStoreConfig,
  userProfile,
  onShowHelp,
  onContactDeveloper,
  onSyncLicense,
  isLicenseSyncing = false,
}) => {
  const expiry = useMemo(
    () => licenseManager.getExpiryDetails(mobileLicense?.expiresAt ?? null),
    [mobileLicense?.expiresAt]
  );
  const isProActive = Boolean(mobileLicense?.isLicensed);
  const isLifetime = isProActive && expiry.isLifetime;

  const currentPlans = useMemo(() => {
    const rawPlans = liveStoreConfig?.plans && liveStoreConfig.plans.length > 0
      ? liveStoreConfig.plans
      : DEFAULT_STORE_PLANS;

    return rawPlans.map(p => {
      const origPrice = p.original_price && p.original_price > p.price
        ? p.original_price
        : p.id === 'lifetime'
        ? 1499
        : p.id === 'annual'
        ? 599
        : 99;

      const discountPct = p.discount_percent || Math.round(((origPrice - p.price) / origPrice) * 100);

      return {
        ...p,
        original_price: origPrice,
        discount_percent: discountPct,
      };
    });
  }, [liveStoreConfig?.plans]);

  // Selected Plan state (default: lifetime)
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
    return currentPlans[0]?.id || 'lifetime';
  });

  const selectedPlan = useMemo(() => {
    return currentPlans.find(p => p.id === selectedPlanId) || currentPlans[0] || DEFAULT_STORE_PLANS[0];
  }, [currentPlans, selectedPlanId]);

  // Active Feature Detail Modal
  const [activeFeatureDetail, setActiveFeatureDetail] = useState<FeatureItem | null>(null);

  // Coupon System State
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountText: string;
    discountType?: string;
    discountValue?: number;
    discountAmount: number;
    finalPrice: number;
  } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Re-calculate discount when selected plan changes
  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
    if (appliedCoupon) {
      const targetPlan = currentPlans.find(p => p.id === planId) || currentPlans[0] || DEFAULT_STORE_PLANS[0];
      const base = targetPlan.price;
      let discountAmount = 0;
      if (appliedCoupon.discountType === 'percent' && appliedCoupon.discountValue) {
        discountAmount = Math.round((base * appliedCoupon.discountValue) / 100);
      } else if (appliedCoupon.discountValue) {
        discountAmount = Math.min(base - 1, Math.round(appliedCoupon.discountValue));
      } else {
        discountAmount = Math.min(base - 1, appliedCoupon.discountAmount);
      }
      const finalPrice = Math.max(1, base - discountAmount);
      setAppliedCoupon({
        ...appliedCoupon,
        discountAmount,
        finalPrice,
      });
    }
    setCouponError(null);
  };

  const handleApplyCoupon = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (!clean) {
      setCouponError('Please enter a promo or referral code.');
      return;
    }
    if (!selectedPlan) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await fetch(
        `https://tg-drive-license-service.jupiterbania472.workers.dev/api/store/validate-coupon?code=${encodeURIComponent(clean)}&_t=${Date.now()}`
      );
      const data = (await res.json()) as {
        valid: boolean;
        code?: string;
        discount_text?: string;
        discount_type?: string;
        discount_value?: number;
        new_price?: number;
        error?: string;
      };
      if (data.valid) {
        const base = selectedPlan.price;
        let discountAmount = 0;
        if (data.discount_type === 'percent' && data.discount_value) {
          discountAmount = Math.round((base * data.discount_value) / 100);
        } else if (data.discount_value) {
          discountAmount = Math.min(base - 1, Math.round(data.discount_value));
        } else if (data.new_price !== undefined) {
          discountAmount = Math.max(0, base - data.new_price);
        }
        const finalPrice = Math.max(1, base - discountAmount);
        setAppliedCoupon({
          code: data.code || clean,
          discountText: data.discount_text || (data.discount_value ? `${data.discount_value}% OFF` : 'Coupon Applied'),
          discountType: data.discount_type,
          discountValue: data.discount_value,
          discountAmount,
          finalPrice,
        });
        setCouponError(null);
        toast.success(`🎉 Coupon "${data.code || clean}" applied! Saved ₹${discountAmount}`);
      } else {
        setAppliedCoupon(null);
        setCouponError(data.error || 'Invalid or expired promo code.');
      }
    } catch {
      // Offline fallback promo codes
      const base = selectedPlan.price;
      if (clean === 'PRO50' || clean === 'VIP50') {
        const discountAmount = Math.round(base * 0.5);
        setAppliedCoupon({
          code: clean,
          discountText: '50% Special',
          discountType: 'percent',
          discountValue: 50,
          discountAmount,
          finalPrice: Math.max(1, base - discountAmount),
        });
        setCouponError(null);
        toast.success(`🎉 Promo code "${clean}" applied!`);
      } else if (clean === 'TGDRIVE' || clean === 'WELCOME10') {
        const discountAmount = Math.round(base * 0.1);
        setAppliedCoupon({
          code: clean,
          discountText: '10% Welcome Discount',
          discountType: 'percent',
          discountValue: 10,
          discountAmount,
          finalPrice: Math.max(1, base - discountAmount),
        });
        setCouponError(null);
        toast.success(`🎉 Promo code "${clean}" applied!`);
      } else {
        setAppliedCoupon(null);
        setCouponError('Invalid coupon code. Please check and try again.');
      }
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const finalCheckoutAmount = appliedCoupon ? appliedCoupon.finalPrice : selectedPlan.price;

  const handleLaunchPayment = async () => {
    if (!selectedPlan) return;
    const finalAmount = finalCheckoutAmount;
    const couponNote = appliedCoupon ? ` [Coupon: ${appliedCoupon.code} - Save ₹${appliedCoupon.discountAmount}]` : '';
    setIsProcessingCheckout(true);
    const toastId = toast.loading(`Initiating secure checkout for ₹${finalAmount}...`);
    try {
      const tgUserId = userProfile?.id ? String(userProfile.id) : '';
      const customerName = userProfile ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() : '';
      const phone = userProfile?.phone || '';

      await licenseManager.startRazorpayCheckout({
        telegramUserId: tgUserId || 'tg_user',
        planType: (selectedPlan.id as LicensePlan) || 'lifetime',
        amount: finalAmount,
        planName: `${selectedPlan.name}${couponNote}`,
        customerName: customerName || 'TG Drive User',
        phoneNumber: phone,
        onOpen: () => {
          setIsProcessingCheckout(false);
          toast.dismiss(toastId);
        },
        onSuccess: (license) => {
          setIsProcessingCheckout(false);
          toast.dismiss(toastId);
          toast.success(`🎉 ${selectedPlan.name} Activated! Pro unlocked on this account.`);
          setMobileLicense(license);
        },
        onError: (err) => {
          setIsProcessingCheckout(false);
          toast.dismiss(toastId);
          toast.error(`Payment not completed: ${err}`);
        },
        onDismiss: () => {
          setIsProcessingCheckout(false);
          toast.dismiss(toastId);
          toast('Payment cancelled', { icon: 'ℹ️' });
        },
      });
    } catch (err) {
      setIsProcessingCheckout(false);
      toast.dismiss(toastId);
      toast.error(err instanceof Error ? err.message : 'Could not launch payment modal');
    }
  };

  return (
    <div className="relative min-h-full pb-36 sm:pb-40 animate-in fade-in duration-200">
      {/* ── Hero Crown & Glowing Badge Section ── */}
      <div className="relative text-center px-4 pt-2 pb-5 space-y-2.5">
        {/* Soft Radial Ambient Glow */}
        <div className="relative mx-auto w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#8B5CF6]/40 via-[#EC4899]/30 to-[#3B82F6]/30 rounded-full blur-2xl animate-pulse" />

          {/* Glowing Squircle Icon Container */}
          <div className="relative z-10 w-22 h-22 rounded-[24px] bg-gradient-to-b from-[#8B5CF6] via-[#A855F7] to-[#D946EF] flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.45)] border border-white/30">
            <Crown className="w-11 h-11 text-white fill-white/20 drop-shadow-md stroke-[2]" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1 max-w-sm mx-auto">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span>TG Drive Pro</span>
            <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white font-extrabold shadow-sm">
              <Sparkles className="w-3 h-3" />
              <span>VIP</span>
            </span>
          </h1>
          <p className="text-xs text-[#9CA3AF] leading-relaxed px-2">
            Unlock exclusive features &amp; go beyond limits with <strong className="text-white font-semibold">TG Drive Pro</strong>
          </p>
        </div>
      </div>

      {/* ── Active Membership Status Banner (If User Already Pro) ── */}
      {isProActive && (
        <div className="mb-4 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-[#13151b] to-amber-500/10 backdrop-blur-2xl p-4 shadow-lg flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-white">Pro Membership Active</h4>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-400 uppercase">
                {isLifetime ? '👑 Lifetime' : 'Active Pass'}
              </span>
            </div>
            <p className="text-[11px] text-[#9CA3AF] mt-0.5 truncate">
              {isLifetime ? 'Permanent VIP access unlocked forever' : `Valid until ${expiry.formattedDate}`}
            </p>
          </div>
        </div>
      )}

      {/* ── Section Title: Choose Your Plan + Limited Time Discount Tag ── */}
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-xs font-black text-[#A78BFA] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
          <span>Choose Your Plan</span>
        </span>
        <span className="text-[10px] font-black text-[#C084FC] uppercase tracking-wider">
          LIMITED TIME — 67% OFF
        </span>
      </div>

      {/* ── Responsive Structured Plan Cards ── */}
      <div className="space-y-3 mb-4">
        {/* ── 1. Lifetime Pro Access Card (Selected / Featured Highlight) ── */}
        {(() => {
          const lifetimePlan = currentPlans.find(p => p.id === 'lifetime') || DEFAULT_STORE_PLANS[0];
          const isSelected = selectedPlanId === 'lifetime';
          const originalPrice = lifetimePlan.original_price || 1499;
          const discountPct = lifetimePlan.discount_percent || 67;
          const savings = originalPrice - lifetimePlan.price;

          return (
            <div
              key="lifetime"
              onClick={() => handleSelectPlan('lifetime')}
              className={`relative rounded-3xl transition-all duration-200 cursor-pointer overflow-hidden p-4 space-y-2.5 select-none ${
                isSelected
                  ? 'bg-gradient-to-b from-[#1E1738]/95 via-[#181329]/95 to-[#131021] border-2 border-[#A855F7] shadow-[0_0_30px_rgba(168,85,247,0.35)]'
                  : 'bg-[#12141C] border border-white/10 hover:border-white/20'
              }`}
            >
              {/* Top Row: Best Value Tag & Lifetime Badge */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/20 border border-[#A855F7]/50 text-[#C084FC] text-[10px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  <span>BEST VALUE</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#271E14] border border-[#F59E0B]/40 text-[#FBBF24] text-[10px] font-black tracking-wide uppercase">
                  <span>👑 LIFETIME • NO RENEWAL</span>
                </span>
              </div>

              {/* Title & Discount Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="shrink-0 text-[#A855F7]">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <h3 className="text-base font-black text-white tracking-tight">
                    {lifetimePlan.name}
                  </h3>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-[#E11D48] text-white text-[10px] font-black uppercase tracking-tight shrink-0 shadow-xs">
                  {discountPct}% OFF
                </span>
              </div>

              {/* Price, MRP & Savings Breakdown */}
              <div className="pl-7 space-y-1">
                {/* Sale Price & Single-time label */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-black text-white font-mono tracking-tight">
                    ₹{lifetimePlan.price}
                  </span>
                  <span className="text-xs text-[#A78BFA] font-bold">
                    One-Time Payment
                  </span>
                </div>

                {/* High Contrast MRP & Save Tag */}
                <div className="flex items-center gap-2 flex-wrap text-xs pt-0.5">
                  <span className="text-[#9CA3AF] font-mono font-medium">
                    MRP: <span className="line-through text-[#D1D5DB] font-bold">₹{originalPrice.toLocaleString()}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#166534] text-[#4ADE80] text-[11px] font-black font-mono shadow-xs">
                    Save ₹{savings.toLocaleString()}
                  </span>
                  <span className="text-[#9CA3AF] text-xs font-medium">
                    • Pay once, access forever
                  </span>
                </div>
              </div>

              {/* Bottom Pro Highlight Footer */}
              <div className="pt-2 border-t border-[#A855F7]/30 flex items-center gap-2 text-xs text-[#E9D5FF] font-semibold pl-1">
                <div className="w-4 h-4 rounded-full bg-[#8B5CF6]/30 text-[#C084FC] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span>All Pro features • No renewals • Permanent access</span>
              </div>
            </div>
          );
        })()}

        {/* ── 2. 1-Year Annual Pass Card ── */}
        {(() => {
          const annualPlan = currentPlans.find(p => p.id === 'annual') || DEFAULT_STORE_PLANS[1];
          const isSelected = selectedPlanId === 'annual';
          const originalPrice = annualPlan.original_price || 599;
          const discountPct = annualPlan.discount_percent || 67;
          const savings = originalPrice - annualPlan.price;
          const monthlyEquiv = Math.round(annualPlan.price / 12);

          return (
            <div
              key="annual"
              onClick={() => handleSelectPlan('annual')}
              className={`rounded-3xl transition-all duration-200 cursor-pointer p-4 space-y-2 select-none ${
                isSelected
                  ? 'bg-gradient-to-b from-[#1E1738]/95 via-[#181329]/95 to-[#131021] border-2 border-[#A855F7] shadow-[0_0_25px_rgba(168,85,247,0.3)]'
                  : 'bg-[#12141C] border border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left side */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="shrink-0 text-[#A855F7] mt-0.5">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-gray-500" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Title and discount */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-white">{annualPlan.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-[#E11D48] text-white text-[10px] font-black uppercase tracking-tight">
                        {discountPct}% OFF
                      </span>
                    </div>

                    {/* MRP & Savings line */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-[#9CA3AF] font-mono font-medium">
                        MRP: <span className="line-through text-[#D1D5DB] font-bold">₹{originalPrice.toLocaleString()}</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#166534] text-[#4ADE80] text-[11px] font-bold font-mono">
                        Save ₹{savings}
                      </span>
                    </div>

                    {/* Subtitle */}
                    <p className="text-[11px] text-[#9CA3AF]">
                      ₹{annualPlan.price} / year • Billed annually
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#D1D5DB] pt-0.5">
                      <Check className="w-3 h-3 text-[#A855F7] shrink-0 stroke-[3]" />
                      <span>₹{monthlyEquiv}/month equivalent • Cancel anytime</span>
                    </div>
                  </div>
                </div>

                {/* Right side Price */}
                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-white font-mono">
                    ₹{annualPlan.price}
                  </span>
                  <p className="text-xs font-bold text-[#C084FC] font-mono mt-0.5">
                    ₹{monthlyEquiv} / month
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── 3. 1-Month Pass Card ── */}
        {(() => {
          const monthlyPlan = currentPlans.find(p => p.id === 'monthly') || DEFAULT_STORE_PLANS[2];
          const isSelected = selectedPlanId === 'monthly';
          const originalPrice = monthlyPlan.original_price || 99;
          const discountPct = monthlyPlan.discount_percent || 51;
          const savings = originalPrice - monthlyPlan.price;

          return (
            <div
              key="monthly"
              onClick={() => handleSelectPlan('monthly')}
              className={`rounded-3xl transition-all duration-200 cursor-pointer p-4 space-y-2 select-none ${
                isSelected
                  ? 'bg-gradient-to-b from-[#1E1738]/95 via-[#181329]/95 to-[#131021] border-2 border-[#A855F7] shadow-[0_0_25px_rgba(168,85,247,0.3)]'
                  : 'bg-[#12141C] border border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Left side */}
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="shrink-0 text-[#A855F7] mt-0.5">
                    {isSelected ? (
                      <div className="w-5 h-5 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-md">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-gray-500" />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    {/* Title and discount */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-white">{monthlyPlan.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-[#E11D48] text-white text-[10px] font-black uppercase tracking-tight">
                        {discountPct}% OFF
                      </span>
                    </div>

                    {/* MRP & Savings line */}
                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <span className="text-[#9CA3AF] font-mono font-medium">
                        MRP: <span className="line-through text-[#D1D5DB] font-bold">₹{originalPrice.toLocaleString()}</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-[#166534] text-[#4ADE80] text-[11px] font-bold font-mono">
                        Save ₹{savings}
                      </span>
                    </div>

                    {/* Subtitle */}
                    <p className="text-[11px] text-[#9CA3AF]">
                      ₹{monthlyPlan.price} / month • Flexible, cancel anytime
                    </p>

                    <div className="flex items-center gap-1.5 text-[11px] text-[#D1D5DB] pt-0.5">
                      <Check className="w-3 h-3 text-[#A855F7] shrink-0 stroke-[3]" />
                      <span>Short-term access • Paid monthly</span>
                    </div>
                  </div>
                </div>

                {/* Right side Price */}
                <div className="text-right shrink-0">
                  <span className="text-2xl font-black text-white font-mono">
                    ₹{monthlyPlan.price}
                  </span>
                  <p className="text-xs font-bold text-[#C084FC] font-mono mt-0.5">
                    ₹{monthlyPlan.price} / month
                  </p>
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Promo Code / Referral Coupon Section ── */}
      <div className="mb-5 rounded-3xl bg-[#12141C] border border-white/10 p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#8B5CF6]/15 text-[#C084FC] flex items-center justify-center shrink-0">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">Promo or Referral Code</h3>
              <p className="text-[10px] text-[#9CA3AF]">Have a discount coupon or friend invite code?</p>
            </div>
          </div>

          {appliedCoupon && (
            <button
              type="button"
              onClick={() => {
                setAppliedCoupon(null);
                setCouponCode('');
                setCouponError(null);
              }}
              className="text-red-400 hover:text-red-300 text-[11px] font-bold underline cursor-pointer"
            >
              Remove
            </button>
          )}
        </div>

        {appliedCoupon ? (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-black flex items-center justify-center shrink-0 font-bold">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-400">
                  {appliedCoupon.code} Applied ({appliedCoupon.discountText})
                </p>
                <p className="text-[10px] text-emerald-300/80">
                  Extra ₹{appliedCoupon.discountAmount} discount applied to your checkout!
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-400 font-mono">-₹{appliedCoupon.discountAmount}</span>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  if (couponError) setCouponError(null);
                }}
                placeholder="Enter Promo Code (e.g. PRO50)"
                className="w-full h-10 px-3.5 rounded-xl bg-[#0B0C10] border border-white/10 text-xs font-mono font-bold text-white uppercase placeholder:text-[#6B7280] placeholder:font-normal placeholder:normal-case focus:outline-none focus:border-[#A855F7] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isValidatingCoupon || !couponCode.trim()}
              className="px-4 h-10 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:brightness-110 text-white text-xs font-black active:scale-95 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-purple-500/25"
            >
              {isValidatingCoupon ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking…</span>
                </>
              ) : (
                <span>Apply</span>
              )}
            </button>
          </form>
        )}

        {couponError && (
          <p className="text-[11px] text-red-400 font-semibold animate-in fade-in duration-150">
            {couponError}
          </p>
        )}
      </div>

      {/* ── Feature List Cards ── */}
      <div className="space-y-2 mb-5">
        <div className="px-2 pb-1">
          <span className="text-xs font-bold text-[#A78BFA] uppercase tracking-wider">
            All Pro Features Included
          </span>
        </div>

        <div className="rounded-3xl bg-[#12141C] border border-white/10 overflow-hidden shadow-xl divide-y divide-white/5">
          {PREMIUM_FEATURES.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveFeatureDetail(item)}
              className="p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors group"
            >
              {/* Left: Square Colored Icon */}
              <div className={`w-10 h-10 rounded-2xl ${item.iconBg} flex items-center justify-center shrink-0 shadow-md`}>
                {item.icon}
              </div>

              {/* Middle: Title & Subtitle */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-[#C084FC] transition-colors">
                    {item.title}
                  </h3>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-[#8B5CF6]/20 text-[#C084FC] uppercase">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#9CA3AF] leading-relaxed line-clamp-2 mt-0.5">
                  {item.subtitle}
                </p>
              </div>

              {/* Right: Chevron Arrow */}
              <div className="text-gray-500 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Secondary Actions: Restore, FAQ & Developer Contact ── */}
      <div className="space-y-2 px-1 mb-6">
        {onSyncLicense && (
          <button
            type="button"
            onClick={() => void onSyncLicense()}
            disabled={isLicenseSyncing}
            className="w-full py-3 px-4 rounded-2xl bg-[#12141C] border border-white/10 text-white hover:bg-white/5 text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C084FC] ${isLicenseSyncing ? 'animate-spin' : ''}`} />
            <span>{isLicenseSyncing ? 'Restoring License…' : 'Already Purchased? Restore License'}</span>
          </button>
        )}

        {onShowHelp && (
          <button
            type="button"
            onClick={onShowHelp}
            className="w-full py-3 px-4 rounded-2xl bg-[#12141C] border border-white/10 text-[#9CA3AF] hover:text-white text-xs font-semibold flex items-center justify-center gap-2 active:scale-98 transition shadow-xs cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-[#C084FC]" />
            <span>Pro License FAQ &amp; Instant Support</span>
          </button>
        )}

        {onContactDeveloper && (
          <button
            type="button"
            onClick={onContactDeveloper}
            className="w-full py-3 px-4 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 text-[#C084FC] text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition shadow-xs cursor-pointer"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 14.4l-2.95-.924c-.643-.204-.657-.643.136-.953l11.526-4.447c.537-.194 1.006.131.59.172z" />
            </svg>
            <span>Contact Developer · @Theexposes</span>
          </button>
        )}
      </div>

      {/* ── Feature Deep-Dive Detail Modal ── */}
      {activeFeatureDetail && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveFeatureDetail(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-sm rounded-[32px] bg-[#161324] border border-[#A855F7]/40 p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveFeatureDetail(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-gray-400 hover:text-white border border-white/10 active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Icon Header */}
            <div className="text-center pt-2 space-y-2">
              <div className="relative mx-auto w-18 h-18 flex items-center justify-center">
                <div className={`w-16 h-16 rounded-full ${activeFeatureDetail.iconBg} flex items-center justify-center shadow-xl ring-4 ring-white/10`}>
                  {activeFeatureDetail.icon}
                </div>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                {activeFeatureDetail.detailTitle}
              </h2>
            </div>

            {/* Bullet List Points */}
            <div className="space-y-3 pt-2">
              {activeFeatureDetail.detailPoints.map((pt, index) => (
                <div key={index} className="flex items-start gap-3 text-left">
                  <div className="w-6 h-6 rounded-lg bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white">{pt.title}</h4>
                    <p className="text-[11px] text-[#9CA3AF] leading-relaxed mt-0.5">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button inside Modal */}
            <div className="pt-3">
              <button
                type="button"
                onClick={() => {
                  setActiveFeatureDetail(null);
                  void handleLaunchPayment();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] hover:brightness-110 active:scale-98 text-white font-black text-xs shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <span>Subscribe for ₹{finalCheckoutAmount}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fixed Bottom Sticky Purchase CTA Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom,16px))] bg-gradient-to-t from-black via-black/95 to-black/20 backdrop-blur-xl border-t border-white/10 shadow-2xl">
        <div className="max-w-md mx-auto space-y-2">
          <button
            type="button"
            onClick={() => void handleLaunchPayment()}
            disabled={isProcessingCheckout}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#4F46E5] via-[#8B5CF6] to-[#EC4899] hover:brightness-110 active:scale-[0.98] text-white font-black text-base shadow-[0_0_30px_rgba(168,85,247,0.45)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessingCheckout ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Launching Secure Payment…</span>
              </>
            ) : (
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5 fill-white text-white" />
                <span>
                  {selectedPlan.id === 'lifetime'
                    ? `Get Lifetime Access • ₹${finalCheckoutAmount.toLocaleString()}`
                    : `Subscribe for ₹${finalCheckoutAmount.toLocaleString()} ${
                        selectedPlan.duration_days && selectedPlan.duration_days >= 300 ? '/ year' : '/ month'
                      }`}
                </span>
              </span>
            )}
          </button>

          <p className="text-[10px] text-center text-[#9CA3AF] flex items-center justify-center gap-1.5 font-medium">
            <Shield className="w-3.5 h-3.5 text-[#22C55E]" />
            <span>Secure 256-bit SSL checkout • UPI • Cards • NetBanking • Instant activation</span>
          </p>
        </div>
      </div>
    </div>
  );
};
