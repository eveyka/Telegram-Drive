import { useEffect, useCallback, useRef } from 'react';
import { useSupporter } from '../context/SupporterContext';
import { triggerSmartDirectLink } from '../services/sponsorLinks';

/**
 * Global periodic smartlink hook.
 *
 * For free users: Every 5 minutes (300,000ms), the very next user click / tap anywhere
 * in the app automatically opens the Adsterra Smartlink in the browser.
 * When returning to the app, the interface is completely clean and unobstructed.
 *
 * For Pro / Supporter users: 100% Ads Free. Never triggers any links.
 */
export function usePeriodicSmartlink(): void {
  const { status: supporterStatus } = useSupporter();

  const isProUser = Boolean(
    supporterStatus.ad_free ||
    supporterStatus.state === 'active'
  );

  // Cached offline pro check so we don't parse JSON on touch events
  const cachedProRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (isProUser) {
      cachedProRef.current = true;
      return;
    }
    // Asynchronously check offline license once on mount or status update
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem('tg_drive_license_data');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.isLicensed && (!parsed.expiresAt || parsed.expiresAt > Math.floor(Date.now() / 1000))) {
            cachedProRef.current = true;
            return;
          }
        }
      }
    } catch {
      // Ignore
    }
    cachedProRef.current = false;
  }, [isProUser]);

  const handleGlobalInteraction = useCallback(() => {
    // 1. Instant memory check (zero IO overhead on tap)
    if (isProUser || cachedProRef.current === true) return;

    // 2. Trigger smart direct link with 5-minute cooldown (non-blocking)
    void triggerSmartDirectLink('periodic_click_smartlink', false);
  }, [isProUser]);

  useEffect(() => {
    if (isProUser) return;

    const options: AddEventListenerOptions = { capture: true, passive: true };
    window.addEventListener('click', handleGlobalInteraction, options);
    window.addEventListener('touchend', handleGlobalInteraction, options);

    return () => {
      window.removeEventListener('click', handleGlobalInteraction, options);
      window.removeEventListener('touchend', handleGlobalInteraction, options);
    };
  }, [handleGlobalInteraction, isProUser]);
}

