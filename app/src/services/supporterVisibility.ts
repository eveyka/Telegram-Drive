export const SUPPORTER_PROMPT_INTERVAL_MS = 24 * 60 * 60 * 1_000;
export const SPONSOR_AD_INTERVAL_MS = 60 * 1_000; // 1 minute cooldown after manual dismiss
export const SUPPORTER_VALUE_MOMENT_EVENT = 'telegram-drive-supporter-value-moment';

export type SupporterValueMoment = 'upload_completed' | 'download_completed';
export type SupporterPromptTrigger = 'ad_dismissed' | SupporterValueMoment;

interface SupporterVisibilityStatus {
  state: string;
  ad_free: boolean;
  recovery_code_saved?: boolean;
  checkout_pending?: boolean;
}

export function shouldShowSponsorContent(status: SupporterVisibilityStatus): boolean {
  if (status.ad_free || status.state === 'active' || status.state === 'loading') return false;
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('tg_drive_license_data');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.isLicensed && (!parsed.expiresAt || parsed.expiresAt > Math.floor(Date.now() / 1000))) {
          return false;
        }
      }
    }
  } catch {}
  return !status.ad_free;
}

export function sponsorAdCooldownRemaining(
  dismissedAt: number | null,
  now = Date.now(),
): number {
  if (dismissedAt === null || !Number.isFinite(dismissedAt) || dismissedAt <= 0) return 0;
  const elapsed = now - dismissedAt;
  if (elapsed < 0) return 0;
  return Math.max(0, SPONSOR_AD_INTERVAL_MS - elapsed);
}

export function shouldOfferNewSupporterPurchase(status: SupporterVisibilityStatus): boolean {
  return status.state === 'inactive' && !status.ad_free && !status.recovery_code_saved;
}

export function announceSupporterValueMoment(moment: SupporterValueMoment): void {
  window.dispatchEvent(new CustomEvent(SUPPORTER_VALUE_MOMENT_EVENT, { detail: { moment } }));
}

export function isSupporterPromptDue(
  status: SupporterVisibilityStatus,
  lastShownAt: number,
  now = Date.now(),
): boolean {
  if (!shouldOfferNewSupporterPurchase(status)) return false;
  if (!Number.isFinite(lastShownAt) || lastShownAt <= 0) return true;
  const elapsed = now - lastShownAt;
  return elapsed < 0 || elapsed >= SUPPORTER_PROMPT_INTERVAL_MS;
}

export function shouldShowSupporterPrompt(
  status: SupporterVisibilityStatus,
  lastShownAt: number,
  now = Date.now(),
): boolean {
  if (status.checkout_pending) return false;
  return isSupporterPromptDue(status, lastShownAt, now);
}

export const PAYWALL_OPEN_EVENT = 'telegram-drive-open-paywall';

export function openPaywallGate(feature: 'folders' | 'autobackup' | 'speed' | 'ads' | 'encryption' | 'general' = 'general'): void {
  window.dispatchEvent(new CustomEvent(PAYWALL_OPEN_EVENT, { detail: { feature } }));
}

export interface BasicFolderItem {
  id: number;
  name: string;
}

/**
 * Checks whether a folder is locked for a free or expired user.
 * Rules:
 * 1. Pro users have all folders unlocked.
 * 2. Saved Messages (null / 'saved') is always unlocked.
 * 3. The 1st custom folder (index 0) is unlocked for free users.
 * 4. Any 2nd, 3rd... custom folders (index >= 1) are locked when Pro is inactive or expired.
 */
export function isCustomFolderLocked(
  folderId: number | string | null | undefined,
  folders: BasicFolderItem[],
  isPro: boolean
): boolean {
  if (isPro) return false;
  if (folderId === null || folderId === undefined || folderId === 'saved' || folderId === 'all') return false;

  const numId = Number(folderId);
  const customFolders = folders.filter(
    f => f.name.toLowerCase() !== 'saved messages' && f.name.toLowerCase() !== 'saved'
  );
  const index = customFolders.findIndex(f => f.id === numId);
  return index >= 1;
}

