import React from 'react';
import {
  Lock,
  Sparkles,
  Folder,
  CloudUpload,
  Zap,
  ShieldCheck,
  MegaphoneOff,
  Check,
  X,
  Crown,
} from 'lucide-react';
import type { PaywallTriggerFeature } from './PaywallGateModal';

export interface LockedFeatureModalProps {
  isOpen: boolean;
  feature?: PaywallTriggerFeature;
  customTitle?: string;
  onClose: () => void;
  onGetPro: () => void;
}

interface FeatureContent {
  title: string;
  badge: string;
  icon: React.ReactNode;
  iconBg: string;
  description: string;
  perks: string[];
}

export const LockedFeatureModal: React.FC<LockedFeatureModalProps> = ({
  isOpen,
  feature = 'general',
  customTitle,
  onClose,
  onGetPro,
}) => {
  if (!isOpen) return null;

  const getContent = (): FeatureContent => {
    switch (feature) {
      case 'folders':
        return {
          title: customTitle || 'Folder Locked',
          badge: 'VIP ACCESS REQUIRED',
          icon: <Folder className="w-8 h-8 text-amber-400" />,
          iconBg: 'from-amber-500/25 via-yellow-500/15 to-amber-600/10 border-amber-500/30 text-amber-400',
          description:
            'This folder is locked. Free plan includes 1 custom folder. To access this folder and manage unlimited custom folders, get VIP / Pro Access.',
          perks: [
            'Unlimited custom folders & subcategories',
            '100% Ad-Free cloud vault experience',
            'Full high-speed MTProto 2.0 streaming',
            'Permanent device binding & fast sync',
          ],
        };
      case 'autobackup':
        return {
          title: customTitle || 'Auto-Backup Locked',
          badge: 'PRO CLOUD SYNC',
          icon: <CloudUpload className="w-8 h-8 text-sky-400" />,
          iconBg: 'from-sky-500/25 via-indigo-500/15 to-blue-600/10 border-sky-500/30 text-sky-400',
          description:
            'Automated background cloud backup is a VIP feature. Upgrade to Pro to automatically safeguard your photos, videos, and files in Telegram.',
          perks: [
            'Automated background media backup',
            'Smart Wi-Fi & battery optimization',
            'Zero cloud storage limits',
            'Instant multi-device access',
          ],
        };
      case 'speed':
        return {
          title: customTitle || 'Turbo Speed Locked',
          badge: 'MAX SPEED ENGINE',
          icon: <Zap className="w-8 h-8 text-emerald-400" />,
          iconBg: 'from-emerald-500/25 via-teal-500/15 to-green-600/10 border-emerald-500/30 text-emerald-400',
          description:
            'Ultra-fast multi-threaded uploads and downloads up to 100 MB/s require TG Drive Pro VIP Access.',
          perks: [
            '100 MB/s dynamic chunking engine',
            'Parallel multi-connection pipeline',
            'No speed throttling or queue delays',
            'High-bandwidth media streaming',
          ],
        };
      case 'ads':
        return {
          title: customTitle || 'Ad-Free VIP Access',
          badge: 'CLEAN EXPERIENCE',
          icon: <MegaphoneOff className="w-8 h-8 text-rose-400" />,
          iconBg: 'from-rose-500/25 via-pink-500/15 to-red-600/10 border-rose-500/30 text-rose-400',
          description:
            'Enjoy a completely distraction-free, 100% ad-free cloud storage dashboard with TG Drive Pro.',
          perks: [
            '100% Ad-Free & banner-free interface',
            'Faster loading and smoother browsing',
            'Zero interruptions during file transfers',
            'Support future app improvements',
          ],
        };
      case 'encryption':
        return {
          title: customTitle || 'Encrypted Vault Locked',
          badge: 'ZERO-KNOWLEDGE AEAD',
          icon: <ShieldCheck className="w-8 h-8 text-purple-400" />,
          iconBg: 'from-purple-500/25 via-violet-500/15 to-indigo-600/10 border-purple-500/30 text-purple-400',
          description:
            'Military-grade client-side encryption (TDENC2) protects your private documents and photos before leaving your device.',
          perks: [
            'End-to-end AEAD zero-knowledge vault',
            'Hardware keystore key protection',
            'Biometric app lock integration',
            'Only you possess the decryption key',
          ],
        };
      case 'general':
      default:
        return {
          title: customTitle || 'VIP Feature Locked',
          badge: 'PRO ACCESS REQUIRED',
          icon: <Crown className="w-8 h-8 text-amber-400" />,
          iconBg: 'from-amber-500/25 via-yellow-500/15 to-orange-600/10 border-amber-500/30 text-amber-400',
          description:
            'This feature is locked. To unlock this feature and all premium capabilities, get VIP Access or TG Drive Pro.',
          perks: [
            'Unlimited cloud storage & max transfer speed',
            'Unlimited custom folders & auto-backup',
            '100% Ad-Free premium experience',
            'Lifetime license & dedicated support',
          ],
        };
    }
  };

  const content = getContent();

  return (
    <div
      className="fixed inset-0 z-[280] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm rounded-[28px] bg-telegram-surface border border-telegram-border/60 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Icon Top-Right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-telegram-bg/60 text-telegram-subtext hover:text-telegram-text hover:bg-telegram-hover active:scale-90 transition-all border border-telegram-border/30"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Body */}
        <div className="p-6 pt-7 text-center relative z-10 space-y-4">
          {/* Animated Lock & Crown Badge */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div
              className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${content.iconBg} border flex items-center justify-center shadow-lg shadow-black/30`}
            >
              {content.icon}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-black border-2 border-telegram-surface shadow-md">
              <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
          </div>

          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-extrabold tracking-wider uppercase shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>{content.badge}</span>
          </div>

          {/* Title & Description */}
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-telegram-text tracking-tight">
              {content.title}
            </h3>
            <p className="text-xs text-telegram-subtext leading-relaxed px-1">
              {content.description}
            </p>
          </div>

          {/* Feature Perks List */}
          <div className="rounded-2xl bg-telegram-bg/50 border border-telegram-border/30 p-3 text-left space-y-2">
            {content.perks.map((perk, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[11px] text-telegram-text">
                <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
                <span className="font-medium">{perk}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons: No thanks & Get Pro */}
          <div className="pt-2 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 px-3 rounded-2xl bg-telegram-bg/70 hover:bg-telegram-hover text-telegram-subtext hover:text-telegram-text border border-telegram-border/50 text-xs font-bold active:scale-95 transition-all shadow-xs"
            >
              No thanks
            </button>

            <button
              type="button"
              onClick={onGetPro}
              className="w-full py-3 px-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-105 active:scale-95 text-black text-xs font-black shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Crown className="w-4 h-4 shrink-0 fill-black/20 stroke-[2.5]" />
              <span>Get Pro</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
