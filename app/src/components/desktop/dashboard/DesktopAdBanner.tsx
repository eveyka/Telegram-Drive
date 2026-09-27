import type { ReactNode } from 'react';

interface DesktopAdBannerProps {
  suppressed?: boolean;
  onSupport?: () => void;
  onManualDismiss?: () => void;
  previewContent?: ReactNode;
}

export function DesktopAdBanner(_props: DesktopAdBannerProps) {
  return null;
}

export function LegacyDesktopAdBanner(_props: DesktopAdBannerProps) {
  return null;
}

