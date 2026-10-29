import React, { useState, useMemo, useEffect } from 'react';
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
  Flame,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  licenseManager,
  type LicenseInfo,
  type LicensePlan,
  type StorePlan,
  type StoreConfig,
  type ActiveSpecialOffer,
} from '../../services/licenseManager';

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
    icon: <Folder className="w-3.5 h-3.5 text-white fill-white/20" />,
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
    icon: <Zap className="w-3.5 h-3.5 text-white fill-white/20" />,
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
    icon: <CloudUpload className="w-3.5 h-3.5 text-white fill-white/20" />,
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
    icon: <ShieldCheck className="w-3.5 h-3.5 text-white fill-white/20" />,
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
    icon: <MegaphoneOff className="w-3.5 h-3.5 text-white fill-white/20" />,
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
    icon: <Smartphone className="w-3.5 h-3.5 text-white fill-white/20" />,
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
    features: ['₹17/month equivalent', 'Cancel anytime before renewal'],
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
  // Plan-aware expiration calculation
  const expiry = useMemo(
    () => licenseManager.getExpiryDetails(mobileLicense?.expiresAt ?? null, mobileLicense?.planType),
    [mobileLicense?.expiresAt, mobileLicense?.planType]
  );

  const isExpired = Boolean(mobileLicense?.isExpired || expiry.isExpired);
  const isProActive = Boolean(mobileLicense?.isLicensed && !isExpired);
  const isLifetime = isProActive && (mobileLicense?.planType === 'lifetime' || (!mobileLicense?.planType && expiry.isLifetime));

  // Helper for human-readable plan title
  const getPlanDisplayName = (type: LicensePlan | null | undefined): string => {
    switch (type) {
      case 'monthly':
        return '1-Month Pass';
      case 'annual':
        return '1-Year Annual Pass';
      case 'lifetime':
        return 'Lifetime Pro Access';
      case 'trial':
        return '7-Day Free Trial';
      default:
        return 'Pro Membership';
    }
  };

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

  // ── Special Offers & Flash Sales State ──
  const [activeOffer, setActiveOffer] = useState<ActiveSpecialOffer | null>(null);
  const [isOfferApplied, setIsOfferApplied] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(30 * 86400); // 30 days default

  // Auto-verify / sync license on mount if Telegram User ID is available
  useEffect(() => {
    if (userProfile?.id) {
      void licenseManager.checkUserAccountProStatus(userProfile.id).then((res) => {
        if (res.license) {
          setMobileLicense(res.license);
        }
      });
    }
  }, [userProfile?.id, setMobileLicense]);

  // Fetch active offer from backend on mount (configured by admin in portal)
  useEffect(() => {
    let isMounted = true;
    void licenseManager.getActiveOffer().then((res) => {
      if (!isMounted) return;
      if (res && res.active && res.offer) {
        setActiveOffer(res.offer);
        if (res.offer.remaining_seconds && res.offer.remaining_seconds > 0) {
          setCountdownSeconds(res.offer.remaining_seconds);
        }
      } else {
        setActiveOffer(null);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // Live countdown timer ticking every second
  useEffect(() => {
    if (countdownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCountdownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownSeconds]);

  // Format countdown string
  const formattedCountdown = useMemo(() => {
    const totalSec = countdownSeconds;
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    return `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
  }, [countdownSeconds]);

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
      if (appliedCoupon.discountType === 'percent' && typeof appliedCoupon.discountValue === 'number') {
        discountAmount = Math.round((base * appliedCoupon.discountValue) / 100);
      } else if (typeof appliedCoupon.discountValue === 'number') {
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

  // Core systematic coupon application function (validates directly against admin backend)
  const executeApplyCoupon = async (rawCode: string) => {
    const clean = rawCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!clean) {
      setCouponError('Please enter a promo or referral code.');
      return;
    }
    if (!selectedPlan) return;

    setIsValidatingCoupon(true);
    setCouponError(null);

    const base = selectedPlan.price;

    // Endpoints for admin-configured live coupons
    const endpoints = [
      `https://tg-drive-license-service.jupiterbania472.workers.dev/api/store/validate-coupon?code=${encodeURIComponent(clean)}&plan_id=${encodeURIComponent(selectedPlan.id)}&price=${encodeURIComponent(base)}&_t=${Date.now()}`,
      `https://tg-drive-license-service.baniarohan009.workers.dev/api/store/validate-coupon?code=${encodeURIComponent(clean)}&plan_id=${encodeURIComponent(selectedPlan.id)}&price=${encodeURIComponent(base)}&_t=${Date.now()}`
    ];

    let lastErrorMessage = 'Invalid coupon or referral code. Please check and try again.';
    let validatedData: {
      valid: boolean;
      code?: string;
      discount_text?: string;
      discount_type?: 'percent' | 'fixed';
      discount_value?: number;
      discount_amount?: number;
      new_price?: number;
      error?: string;
    } | null = null;

    for (const url of endpoints) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as {
            valid: boolean;
            code?: string;
            discount_text?: string;
            discount_type?: 'percent' | 'fixed';
            discount_value?: number;
            discount_amount?: number;
            new_price?: number;
            error?: string;
          };
          if (data.valid) {
            validatedData = data;
            break;
          } else if (data.error) {
            lastErrorMessage = data.error;
          }
        }
      } catch {
        // Continue to fallback endpoint
      }
    }

    if (validatedData && validatedData.valid) {
      const discountType = validatedData.discount_type || 'percent';
      const discountVal = validatedData.discount_value ?? 0;
      let discountAmount = 0;
      if (typeof validatedData.discount_amount === 'number' && validatedData.discount_amount > 0) {
        discountAmount = Math.min(base - 1, validatedData.discount_amount);
      } else if (typeof validatedData.new_price === 'number' && validatedData.new_price > 0 && validatedData.new_price < base) {
        discountAmount = base - validatedData.new_price;
      } else if (discountType === 'percent') {
        discountAmount = Math.round((base * discountVal) / 100);
      } else {
        discountAmount = Math.min(base - 1, Math.round(discountVal));
      }
      const finalPrice = Math.max(1, base - discountAmount);

      setAppliedCoupon({
        code: validatedData.code || clean,
        discountText: validatedData.discount_text || (discountType === 'percent' ? `${discountVal}% OFF` : `₹${discountAmount} OFF`),
        discountType,
        discountValue: discountVal,
        discountAmount,
        finalPrice,
      });
      setCouponCode(validatedData.code || clean);
      setCouponError(null);
      toast.success(`🎉 Coupon "${validatedData.code || clean}" applied! Saved ₹${discountAmount}`);
    } else {
      setAppliedCoupon(null);
      setCouponError(lastErrorMessage);
    }

    setIsValidatingCoupon(false);
  };

  const handleApplyCoupon = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    void executeApplyCoupon(couponCode);
  };

  // Apply or Toggle Special Offer
  const handleToggleSpecialOffer = () => {
    if (isOfferApplied) {
      setIsOfferApplied(false);
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError(null);
      toast('Special offer removed', { icon: 'ℹ️' });
      return;
    }

    const offerCode = activeOffer?.coupon_code;
    if (!offerCode) return;
    setIsOfferApplied(true);
    void executeApplyCoupon(offerCode);
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
          toast.success('📱 UPI Checkout opened! Complete payment in Google Pay / PhonePe.', { duration: 6000 });
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
    <div className={`relative min-h-full animate-in fade-in duration-200 ${isLifetime ? 'pb-8' : 'pb-32 sm:pb-36'}`}>
      {/* ── Compact Header Section ── */}
      <div className="text-center px-3 pt-0.5 pb-2.5 space-y-1.5 select-none">
        {/* Compact Squircle Crown Badge */}
        <div className="relative mx-auto w-14 h-14 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#8B5CF6]/40 via-[#EC4899]/30 to-[#3B82F6]/30 rounded-2xl blur-lg animate-pulse" />
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-b from-[#8B5CF6] via-[#A855F7] to-[#D946EF] flex items-center justify-center shadow-lg border border-white/30">
            <Crown className="w-6 h-6 text-white fill-white/20 drop-shadow-md stroke-[2.2]" />
          </div>
        </div>

        {/* Title & Concise Subtitle */}
        <div className="space-y-0.5 max-w-sm mx-auto">
          <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            <span>TG Drive Pro</span>
            <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.2 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] text-white font-extrabold shadow-xs">
              <Sparkles className="w-2.5 h-2.5" />
              <span>VIP</span>
            </span>
          </h1>
          <p className="text-[10px] sm:text-[11px] text-[#9CA3AF] leading-tight px-2">
            Unlock Turbo 100 MB/s speed, TDENC2 vault &amp; zero ads
          </p>
        </div>
      </div>

      {/* ── 1. LIFETIME PRO ACTIVE HERO CARD (When Lifetime Active) ── */}
      {isLifetime && (
        <div className="mb-3.5 rounded-3xl border-2 border-amber-500/50 bg-gradient-to-b from-[#221708] via-[#16111f] to-[#0c0d14] p-3.5 sm:p-4 shadow-xl shadow-amber-950/30 space-y-3 select-none animate-in fade-in zoom-in-95 duration-200">
          {/* Top Badge & Crown Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center shadow-lg shadow-amber-500/25 border border-amber-300/60 shrink-0">
                <Crown className="w-5 h-5 text-black fill-black" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-1.5 truncate">
                  <span>Lifetime Pro Active</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-extrabold uppercase shrink-0">
                    VIP
                  </span>
                </h3>
                <p className="text-[10px] text-amber-200/80 font-medium truncate">
                  Permanent VIP Access Unlocked Forever
                </p>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs shrink-0">
              👑 Lifetime
            </span>
          </div>

          {/* Bound Account & Status Pill */}
          <div className="p-2.5 rounded-2xl bg-black/50 border border-white/10 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-[#D1D5DB] text-[11px]">
              <span className="text-[#9CA3AF]">Account Status:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Permanent VIP Active</span>
              </span>
            </div>
            {userProfile?.id && (
              <div className="flex items-center justify-between text-[#D1D5DB] text-[11px]">
                <span className="text-[#9CA3AF]">Bound Telegram:</span>
                <span className="font-mono font-bold text-white">
                  {userProfile.username ? `@${userProfile.username}` : `ID: ${userProfile.id}`}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-[#D1D5DB] text-[11px]">
              <span className="text-[#9CA3AF]">Renewal Policy:</span>
              <span className="font-bold text-amber-300">Zero Renewals Forever</span>
            </div>
          </div>

          {/* Unlocked Perks Grid */}
          <div className="space-y-1.5 pt-0.5">
            <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider block">
              Permanent Unlocked Perks:
            </span>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <span className="font-bold text-white truncate">100 MB/s Turbo</span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold text-white truncate">TDENC2 Vault</span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                <MegaphoneOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="font-bold text-white truncate">100% Zero Ads</span>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                <Smartphone className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="font-bold text-white truncate">All Devices Sync</span>
              </div>
            </div>
          </div>

          {/* Sync / Refresh Button */}
          {onSyncLicense && (
            <button
              type="button"
              onClick={onSyncLicense}
              disabled={isLicenseSyncing}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 active:scale-98 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLicenseSyncing ? 'animate-spin text-amber-400' : 'text-gray-400'}`} />
              <span>{isLicenseSyncing ? 'Syncing License…' : 'Sync / Verify Status'}</span>
            </button>
          )}
        </div>
      )}

      {/* ── 2. NON-LIFETIME ACTIVE SUBSCRIPTION STATUS CARD (Monthly / Annual) ── */}
      {isProActive && !isLifetime && (
        <div className="mb-2.5 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-[#11141c] to-[#0c0e14] p-3 shadow-lg shadow-emerald-950/20 space-y-2">
          {/* Top row: Plan Title, Crown Icon, and Active Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white truncate flex items-center gap-1.5">
                  <span>{getPlanDisplayName(mobileLicense?.planType)}</span>
                  <span className="text-[9px] text-emerald-400 font-bold">• Active</span>
                </h4>
                <p className="text-[10px] text-emerald-300/80 truncate">
                  Valid until {expiry.formattedDate}
                </p>
              </div>
            </div>

            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 border ${
              expiry.status === 'expiring_soon'
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {expiry.status === 'expiring_soon' ? `⚠️ ${expiry.countdownText}` : `🟢 ${expiry.countdownText}`}
            </span>
          </div>

          {/* Expiry Details & Timestamps */}
          <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[10px]">
            <div className="flex items-center justify-between gap-2 text-[#D1D5DB]">
              <span className="flex items-center gap-1 text-[#9CA3AF]">
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>Expires on:</span>
              </span>
              <span className="font-mono font-bold text-white">
                {expiry.formattedDate} at {expiry.formattedTime}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[#D1D5DB]">
              <span className="flex items-center gap-1 text-[#9CA3AF]">
                <Clock className="w-3 h-3 text-[#A78BFA]" />
                <span>Remaining:</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {expiry.countdownText}
              </span>
            </div>
          </div>

          {/* Pro Benefits Active Pills */}
          <div className="flex items-center gap-1 flex-wrap pt-0.5 text-[9px] font-medium text-[#A7F3D0]">
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
              <span>100 MB/s Turbo</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
              <span>TDENC2 Vault</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
              <MegaphoneOff className="w-2.5 h-2.5 text-rose-400" />
              <span>Zero Ads</span>
            </span>
          </div>
        </div>
      )}

      {/* ── 3. EXPIRED SUBSCRIPTION STATUS CARD ── */}
      {isExpired && (
        <div className="mb-2.5 rounded-2xl border border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-[#181116] to-[#0f0e14] p-3 shadow-lg shadow-rose-950/20 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white truncate flex items-center gap-1.5">
                  <span>{getPlanDisplayName(mobileLicense?.planType)}</span>
                  <span className="text-[9px] text-rose-400 font-bold">• Expired</span>
                </h4>
                <p className="text-[10px] text-[#9CA3AF] truncate">
                  Expired on {expiry.formattedDate}
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
              🔴 Expired
            </span>
          </div>

          <div className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1 text-[10px]">
            <div className="flex items-center justify-between gap-2 text-[#D1D5DB]">
              <span className="flex items-center gap-1 text-[#9CA3AF]">
                <Clock className="w-3 h-3 text-rose-400" />
                <span>Expired on:</span>
              </span>
              <span className="font-mono font-bold text-rose-300">
                {expiry.formattedDate} at {expiry.formattedTime}
              </span>
            </div>
            <p className="text-[10px] text-[#9CA3AF] leading-snug pt-0.5">
              Your VIP benefits have paused. Renew below to immediately restore unlimited 100 MB/s speed, vault encryption, and ad-free experience.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (mobileLicense?.planType) {
                handleSelectPlan(mobileLicense.planType);
              }
              const planSection = document.getElementById('plans-selection-section');
              planSection?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:brightness-110 active:scale-98 text-black text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Zap className="w-3 h-3 fill-black text-black" />
            <span>Renew {getPlanDisplayName(mobileLicense?.planType)} Now</span>
          </button>
        </div>
      )}

      {/* ── 4. PURCHASE / UPGRADE PLANS SECTION (Hidden for Lifetime Members) ── */}
      {!isLifetime && (
        <>
          {/* ── 4.1 FLASH DEAL BANNER ── */}
          {activeOffer && (
        <div className="mb-3 relative rounded-2xl overflow-hidden border border-amber-500/35 bg-gradient-to-r from-[#221607] via-[#1a1222] to-[#140c1e] p-2.5 sm:p-3 shadow-md transition-all">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Left badge & countdown */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-black text-[9px] font-black uppercase">
                <Flame className="w-2.5 h-2.5 fill-black text-black" />
                <span>50% FLASH SALE</span>
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[9px] font-mono font-bold">
                <Clock className="w-2.5 h-2.5 text-amber-400" />
                <span>{formattedCountdown}</span>
              </span>
            </div>

            {/* Offer button */}
            <button
              type="button"
              onClick={handleToggleSpecialOffer}
              className={`px-3 py-1 rounded-xl text-[11px] font-black transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-sm shrink-0 ${
                isOfferApplied
                  ? 'bg-emerald-500 text-black shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-110 text-black'
              }`}
            >
              {isOfferApplied ? (
                <>
                  <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />
                  <span>Applied</span>
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 fill-black text-black" />
                  <span>Apply Offer</span>
                </>
              )}
            </button>
          </div>

          {/* Pricing Row */}
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <div>
              <p className="text-[11px] text-white font-bold">
                Lifetime VIP Access for only <span className="text-amber-300 font-mono font-black text-sm">₹{activeOffer.offer_price || 249}</span>
                <span className="ml-1.5 text-[10px] text-[#9CA3AF] line-through font-mono">₹{activeOffer.original_price || 499}</span>
              </p>
            </div>
            <span className="text-[9px] text-[#A78BFA] font-medium">Save ₹1,250 on MRP</span>
          </div>
        </div>
      )}

      {/* ── 4. CHOOSE YOUR PLAN / UPGRADE HEADER ── */}
      <div id="plans-selection-section" className="flex items-center justify-between px-1 pb-1.5 pt-1">
        <span className="text-[11px] font-black text-[#A78BFA] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#C084FC]" />
          <span>{isProActive ? 'Extend or Upgrade Plan' : 'Choose Your Plan'}</span>
        </span>
        <span className="text-[9px] font-black text-[#C084FC] uppercase tracking-wider">
          {isOfferApplied ? '🔥 50% DISCOUNT APPLIED' : isProActive ? '👑 UPGRADE TO LIFETIME' : '⚡ INSTANT ACTIVATION'}
        </span>
      </div>

      {/* ── 5. STRUCTURED COMPACT PLAN CARDS ── */}
      <div className="space-y-2 mb-3">
        {/* ── Lifetime Pro Access Card ── */}
        {(() => {
          const lifetimePlan = currentPlans.find(p => p.id === 'lifetime') || DEFAULT_STORE_PLANS[0];
          const isSelected = selectedPlanId === 'lifetime';
          const originalPrice = lifetimePlan.original_price || 1499;
          const currentPlanPrice = appliedCoupon && isSelected ? appliedCoupon.finalPrice : lifetimePlan.price;
          const discountPct = Math.round(((originalPrice - currentPlanPrice) / originalPrice) * 100);
          const savings = originalPrice - currentPlanPrice;

          return (
            <div
              key="lifetime"
              onClick={() => handleSelectPlan('lifetime')}
              className={`relative rounded-2xl transition-all duration-150 cursor-pointer overflow-hidden p-3 space-y-1.5 select-none ${
                isSelected
                  ? 'bg-gradient-to-b from-[#221840] via-[#181329] to-[#120F20] border-2 border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.28)]'
                  : 'bg-[#12141C] border border-white/10 hover:border-white/20'
              }`}
            >
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-1">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#8B5CF6]/20 border border-[#A855F7]/40 text-[#C084FC] text-[8px] font-black uppercase">
                  <Sparkles className="w-2 h-2" />
                  <span>BEST VALUE</span>
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-[#271E14] border border-[#F59E0B]/30 text-[#FBBF24] text-[8px] font-black uppercase">
                  <span>👑 LIFETIME • NO RENEWAL</span>
                </span>
              </div>

              {/* Title & Price Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="shrink-0 text-[#A855F7]">
                    {isSelected ? (
                      <div className="w-4 h-4 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <Circle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                      <span>{lifetimePlan.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#E11D48] text-white uppercase">
                        {discountPct}% OFF
                      </span>
                    </h3>
                    <p className="text-[10px] text-[#9CA3AF]">
                      MRP: <span className="line-through">₹{originalPrice.toLocaleString()}</span> • Save ₹{savings.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-lg sm:text-xl font-black text-white font-mono">
                    ₹{currentPlanPrice}
                  </span>
                  <p className="text-[9px] text-[#A78BFA] font-bold">One-Time</p>
                </div>
              </div>

              {/* Bottom Pro Highlight Footer */}
              <div className="pt-1 border-t border-white/5 flex items-center gap-1 text-[10px] text-[#E9D5FF] pl-6">
                <Check className="w-3 h-3 text-[#A855F7] stroke-[3] shrink-0" />
                <span>All Pro features • Permanent VIP access • Zero renewals</span>
              </div>
            </div>
          );
        })()}

        {/* ── 1-Year Annual Pass Card ── */}
        {(() => {
          const annualPlan = currentPlans.find(p => p.id === 'annual') || DEFAULT_STORE_PLANS[1];
          const isSelected = selectedPlanId === 'annual';
          const originalPrice = annualPlan.original_price || 599;
          const currentPlanPrice = appliedCoupon && isSelected ? appliedCoupon.finalPrice : annualPlan.price;
          const discountPct = Math.round(((originalPrice - currentPlanPrice) / originalPrice) * 100);
          const monthlyEquiv = Math.round(currentPlanPrice / 12);
          const savings = originalPrice - currentPlanPrice;

          return (
            <div
              key="annual"
              onClick={() => handleSelectPlan('annual')}
              className={`rounded-2xl transition-all duration-150 cursor-pointer p-3 space-y-1.5 select-none ${
                isSelected
                  ? 'bg-gradient-to-b from-[#221840] via-[#181329] to-[#120F20] border-2 border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                  : 'bg-[#12141C] border border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="shrink-0 text-[#A855F7]">
                    {isSelected ? (
                      <div className="w-4 h-4 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <Circle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                      <span>{annualPlan.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#E11D48] text-white uppercase">
                        {discountPct}% OFF
                      </span>
                    </h3>
                    <p className="text-[10px] text-[#9CA3AF]">
                      MRP: <span className="line-through">₹{originalPrice.toLocaleString()}</span> • Save ₹{savings}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-lg sm:text-xl font-black text-white font-mono">
                    ₹{currentPlanPrice}
                  </span>
                  <p className="text-[9px] font-bold text-[#C084FC] font-mono">₹{monthlyEquiv} / mo</p>
                </div>
              </div>

              <div className="pt-1 border-t border-white/5 flex items-center gap-1 text-[10px] text-[#D1D5DB] pl-6">
                <Check className="w-3 h-3 text-[#A855F7] stroke-[3] shrink-0" />
                <span>365-day full Pro access • Equivalent to ₹17/month</span>
              </div>
            </div>
          );
        })()}

        {/* ── 1-Month Pass Card ── */}
        {(() => {
          const monthlyPlan = currentPlans.find(p => p.id === 'monthly') || DEFAULT_STORE_PLANS[2];
          const isSelected = selectedPlanId === 'monthly';
          const originalPrice = monthlyPlan.original_price || 99;
          const currentPlanPrice = appliedCoupon && isSelected ? appliedCoupon.finalPrice : monthlyPlan.price;
          const discountPct = Math.round(((originalPrice - currentPlanPrice) / originalPrice) * 100);
          const savings = originalPrice - currentPlanPrice;

          return (
            <div
              key="monthly"
              onClick={() => handleSelectPlan('monthly')}
              className={`rounded-2xl transition-all duration-150 cursor-pointer p-3 space-y-1.5 select-none ${
                isSelected
                  ? 'bg-gradient-to-b from-[#221840] via-[#181329] to-[#120F20] border-2 border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                  : 'bg-[#12141C] border border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="shrink-0 text-[#A855F7]">
                    {isSelected ? (
                      <div className="w-4 h-4 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    ) : (
                      <Circle className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                      <span>{monthlyPlan.name}</span>
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black bg-[#E11D48] text-white uppercase">
                        {discountPct}% OFF
                      </span>
                    </h3>
                    <p className="text-[10px] text-[#9CA3AF]">
                      MRP: <span className="line-through">₹{originalPrice.toLocaleString()}</span> • Save ₹{savings}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-lg sm:text-xl font-black text-white font-mono">
                    ₹{currentPlanPrice}
                  </span>
                  <p className="text-[9px] font-bold text-[#9CA3AF]">30 Days</p>
                </div>
              </div>

              <div className="pt-1 border-t border-white/5 flex items-center gap-1 text-[10px] text-[#D1D5DB] pl-6">
                <Check className="w-3 h-3 text-[#A855F7] stroke-[3] shrink-0" />
                <span>30-day flexible pass • Full Pro speed &amp; vault</span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── 6. COMPACT PROMO CODE / COUPON SECTION ── */}
      <div className="mb-3 rounded-2xl bg-[#12141C] border border-white/10 p-2.5 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="text-xs font-bold text-white">Promo or Referral Code</span>
          </div>

          {appliedCoupon && (
            <button
              type="button"
              onClick={() => {
                setAppliedCoupon(null);
                setCouponCode('');
                setCouponError(null);
                setIsOfferApplied(false);
                toast('Coupon removed', { icon: 'ℹ️' });
              }}
              className="text-red-400 hover:text-red-300 text-[10px] font-bold underline cursor-pointer"
            >
              Remove
            </button>
          )}
        </div>

        {appliedCoupon ? (
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3] shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] font-black text-emerald-400 block truncate">
                  {appliedCoupon.code} • {appliedCoupon.discountText}
                </span>
                <span className="text-[9px] text-emerald-300/80">
                  Applied to {selectedPlan.name}
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-400 font-mono shrink-0 pl-2">
              -₹{appliedCoupon.discountAmount}
            </span>
          </div>
        ) : (
          <form onSubmit={handleApplyCoupon} className="flex gap-1.5">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                if (couponError) setCouponError(null);
              }}
              placeholder="Enter Promo Code (e.g. FLASH50)"
              className="flex-1 h-8 px-2.5 rounded-xl bg-[#0B0C10] border border-white/10 text-xs font-mono font-bold text-white uppercase placeholder:text-[#6B7280] placeholder:font-normal placeholder:normal-case focus:outline-none focus:border-[#A855F7] transition-colors"
            />
            <button
              type="submit"
              disabled={isValidatingCoupon || !couponCode.trim()}
              className="px-3 h-8 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#EC4899] hover:brightness-110 text-white text-xs font-bold active:scale-95 disabled:opacity-40 transition-all cursor-pointer flex items-center justify-center gap-1 shrink-0"
            >
              {isValidatingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Apply</span>}
            </button>
          </form>
        )}

        {couponError && (
          <p className="text-[10px] text-red-400 font-semibold animate-in fade-in duration-150">
            {couponError}
          </p>
        )}
      </div>
        </>
      )}

      {/* ── 5. COMPACT FEATURES LIST ── */}
      <div className="space-y-1.5 mb-3.5">
        <div className="px-1 pb-0.5 flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#A78BFA] uppercase tracking-wider">
            All Pro Features Included
          </span>
          <span className="text-[9px] text-[#9CA3AF]">Tap to learn more</span>
        </div>

        <div className="rounded-2xl bg-[#12141C] border border-white/10 overflow-hidden shadow-md divide-y divide-white/5">
          {PREMIUM_FEATURES.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveFeatureDetail(item)}
              className="p-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-white/5 active:bg-white/10 transition-colors group"
            >
              <div className={`w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                {item.icon}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <h3 className="text-xs font-bold text-white group-hover:text-[#C084FC] transition-colors">
                    {item.title}
                  </h3>
                  {item.badge && (
                    <span className="px-1 py-0.1 rounded text-[7px] font-black bg-[#8B5CF6]/20 text-[#C084FC] uppercase">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[9px] text-[#9CA3AF] truncate">
                  {item.subtitle}
                </p>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-white shrink-0 transition-transform" />
            </div>
          ))}
        </div>
      </div>

      {/* ── 8. SECONDARY ACTIONS (SYNC, FAQ, SUPPORT) ── */}
      <div className="space-y-1.5 px-0.5 mb-4">
        {onSyncLicense && (
          <button
            type="button"
            onClick={() => void onSyncLicense()}
            disabled={isLicenseSyncing}
            className="w-full py-2 px-3 rounded-xl bg-[#12141C] border border-white/10 text-white hover:bg-white/5 text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C084FC] ${isLicenseSyncing ? 'animate-spin' : ''}`} />
            <span>{isLicenseSyncing ? 'Checking with Server…' : 'Already Paid? Sync / Restore License'}</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          {onShowHelp && (
            <button
              type="button"
              onClick={onShowHelp}
              className="py-2 px-2.5 rounded-xl bg-[#12141C] border border-white/10 text-[#9CA3AF] hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition cursor-pointer"
            >
              <HelpCircle className="w-3 h-3 text-[#C084FC]" />
              <span>License FAQ</span>
            </button>
          )}

          {onContactDeveloper && (
            <button
              type="button"
              onClick={onContactDeveloper}
              className="py-2 px-2.5 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 text-[#C084FC] text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-98 transition cursor-pointer"
            >
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.248-1.97 9.289c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.26 14.4l-2.95-.924c-.643-.204-.657-.643.136-.953l11.526-4.447c.537-.194 1.006.131.59.172z" />
              </svg>
              <span>Developer Help</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Feature Deep-Dive Detail Modal ── */}
      {activeFeatureDetail && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setActiveFeatureDetail(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-sm rounded-[24px] bg-[#161324] border border-[#A855F7]/40 p-4 shadow-2xl space-y-3 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveFeatureDetail(null)}
              className="absolute top-3 right-3 p-1 rounded-full bg-black/60 text-gray-400 hover:text-white border border-white/10 active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Icon Header */}
            <div className="text-center pt-1 space-y-1">
              <div className={`mx-auto w-10 h-10 rounded-xl ${activeFeatureDetail.iconBg} flex items-center justify-center shadow-md`}>
                {activeFeatureDetail.icon}
              </div>
              <h2 className="text-sm font-black text-white">
                {activeFeatureDetail.detailTitle}
              </h2>
            </div>

            {/* Bullet List Points */}
            <div className="space-y-2 pt-1 max-h-60 overflow-y-auto">
              {activeFeatureDetail.detailPoints.map((pt, index) => (
                <div key={index} className="flex items-start gap-2 text-left">
                  <div className="w-4 h-4 rounded-md bg-[#8B5CF6]/20 text-[#C084FC] border border-[#8B5CF6]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-2.5 h-2.5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-white">{pt.title}</h4>
                    <p className="text-[9px] text-[#9CA3AF] leading-relaxed mt-0.5">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Button inside Modal */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  setActiveFeatureDetail(null);
                  void handleLaunchPayment();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6366F1] via-[#8B5CF6] to-[#EC4899] hover:brightness-110 active:scale-98 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <span>Subscribe for ₹{finalCheckoutAmount}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. VERIFIED LIFETIME VIP FOOTER (Shown only for Lifetime Members) ── */}
      {isLifetime && (
        <div className="pt-2 pb-6 text-center space-y-1.5 select-none animate-in fade-in duration-200">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] font-bold shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Lifetime VIP Entitlement Active</span>
          </div>
          <p className="text-[10px] text-[#9CA3AF]">
            Your Telegram account is permanently authorized • Zero renewals required forever
          </p>
        </div>
      )}

      {/* ── 7. FIXED BOTTOM STICKY PURCHASE BAR (Hidden for Lifetime Members) ── */}
      {!isLifetime && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,12px))] bg-gradient-to-t from-black via-black/95 to-black/30 backdrop-blur-xl border-t border-white/10 shadow-2xl">
          <div className="max-w-md mx-auto space-y-1">
            <button
              type="button"
              onClick={() => void handleLaunchPayment()}
              disabled={isProcessingCheckout}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#4F46E5] via-[#8B5CF6] to-[#EC4899] hover:brightness-110 active:scale-[0.98] text-white font-black text-sm shadow-[0_0_20px_rgba(168,85,247,0.35)] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessingCheckout ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Launching Secure Payment…</span>
                </>
              ) : (
                <span className="flex items-center gap-1.5 flex-wrap justify-center">
                  <Zap className="w-4 h-4 fill-white text-white shrink-0" />
                  <span>
                    {isProActive
                      ? selectedPlan.id === 'lifetime'
                        ? `Upgrade to Lifetime • ₹${finalCheckoutAmount.toLocaleString()}`
                        : `Extend Subscription • ₹${finalCheckoutAmount.toLocaleString()}`
                      : selectedPlan.id === 'lifetime'
                      ? `Get Lifetime Access • ₹${finalCheckoutAmount.toLocaleString()}`
                      : `Subscribe for ₹${finalCheckoutAmount.toLocaleString()} ${
                          selectedPlan.duration_days && selectedPlan.duration_days >= 300 ? '/ year' : '/ month'
                        }`}
                  </span>
                  {appliedCoupon && (
                    <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 text-white font-extrabold uppercase shrink-0">
                      Save ₹{appliedCoupon.discountAmount}
                    </span>
                  )}
                </span>
              )}
            </button>

            <p className="text-[9px] text-center text-[#9CA3AF] flex items-center justify-center gap-1 font-medium">
              <Shield className="w-3 h-3 text-[#22C55E]" />
              <span>Secure 256-bit SSL • Instant Activation • Google Pay / PhonePe / Cards</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
