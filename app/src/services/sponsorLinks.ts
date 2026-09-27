import { ADSTERRA_CONFIG } from '../config/adsterraConfig';
import { openExternalUrl } from '../utils/url';

export type SponsorPlacement =
  | 'first_ad_gateway'
  | 'android_banner'
  | 'desktop_banner_fallback'
  | 'download_trigger'
  | 'upload_trigger'
  | 'profile_deal'
  | 'rewards_hub'
  | string;

export const SPONSOR_URL = ADSTERRA_CONFIG.directLinkUrl;

const LAST_DIRECT_LINK_TRIGGER_KEY = 'tg_drive_last_direct_link_time';

export function sponsorUrlFor(placement: SponsorPlacement): string {
  const url = ADSTERRA_CONFIG.directLinkUrl || 'https://www.profitableratecpmnetwork.com/gr3ba9pja?key=45510c1e39c688625bc6973957e221ae';
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}psid=${encodeURIComponent(placement)}`;
}

export function isSafeSponsorDestination(destination: string): boolean {
  try {
    const parsed = new URL(destination);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function openSponsorDestination(destination: string): Promise<boolean> {
  if (!isSafeSponsorDestination(destination)) return false;
  return openExternalUrl(destination);
}

export async function openSponsorLink(placement: SponsorPlacement = 'android_banner'): Promise<boolean> {
  return openSponsorDestination(sponsorUrlFor(placement));
}

let inMemoryLastTriggerTime: number | null = null;

function getLastTriggerTime(): number {
  if (inMemoryLastTriggerTime !== null) {
    return inMemoryLastTriggerTime;
  }
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_DIRECT_LINK_TRIGGER_KEY) : null;
    inMemoryLastTriggerTime = raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    inMemoryLastTriggerTime = 0;
  }
  return inMemoryLastTriggerTime;
}

/**
 * Smartly triggers a Direct Link on high-value user actions (like starting a download)
 * for free users, with cooldown protection to avoid excessive triggers.
 */
export async function triggerSmartDirectLink(
  placement: SponsorPlacement = 'download_trigger',
  isProUser = false,
  force = false,
): Promise<boolean> {
  // Pro users NEVER receive ads or direct links
  if (isProUser) return false;
  if (!ADSTERRA_CONFIG.enableActionDirectLinks && !force) return false;

  const now = Date.now();
  if (!force) {
    const lastTriggered = getLastTriggerTime();
    if (now - lastTriggered < ADSTERRA_CONFIG.actionTriggerCooldownMs) {
      return false; // Still in cooldown - instant return without IO
    }
  }

  inMemoryLastTriggerTime = now;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LAST_DIRECT_LINK_TRIGGER_KEY, String(now));
    }
  } catch {
    // Ignore storage write issues
  }

  return openSponsorLink(placement);
}



