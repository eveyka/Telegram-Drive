/**
 * Adsterra Monetization & Ad Network Configuration
 * 
 * Configured with active Adsterra publisher keys & smartlinks.
 */

export interface AdsterraConfig {
  /** Your Adsterra Direct Link (Smartlink) URL */
  directLinkUrl: string;
  /** Alternate / Fallback Direct Link URL */
  fallbackDirectLinkUrl?: string;
  /** Your Adsterra Banner Zone Key */
  bannerZoneKey: string;
  /** Your Adsterra Banner Script URL */
  bannerScriptUrl: string;
  /** Banner width */
  bannerWidth: number;
  /** Banner height */
  bannerHeight: number;
  /** Your Adsterra Native / Social Bar Zone Script URL (optional) */
  socialBarScriptUrl?: string;
  /** Ad cooldown interval after manual dismiss (in milliseconds) - Default: 1 min */
  cooldownMs: number;
  /** Cooldown between automatic action-triggered direct links (in milliseconds) - Default: 5 mins */
  actionTriggerCooldownMs: number;
  /** Whether action-triggered direct links (e.g. on file download) are enabled */
  enableActionDirectLinks: boolean;
  /** Auto-dismiss countdown in seconds (0 = persistent until user closes) */
  autoDismissSeconds: number;
}

export const ADSTERRA_CONFIG: AdsterraConfig = {
  // User's Active Adsterra Smartlink (Direct Link)
  directLinkUrl: 'https://www.profitableratecpmnetwork.com/gr3ba9pja?key=45510c1e39c688625bc6973957e221ae',
  fallbackDirectLinkUrl: 'https://www.profitableratecpmnetwork.com/gr3ba9pja?key=45510c1e39c688625bc6973957e221ae',
  // Adsterra 320x50 Banner Key & Script
  bannerZoneKey: '62d4a6f015cbff1fd2ab211f514e0183',
  bannerScriptUrl: 'https://www.highrevenueformat.com/62d4a6f015cbff1fd2ab211f514e0183/invoke.js',
  bannerWidth: 320,
  bannerHeight: 50,
  cooldownMs: 60 * 1000, // 1 minute cooldown after closing banner
  actionTriggerCooldownMs: 5 * 60 * 1000, // 5 minutes cooldown between download-triggered direct links
  enableActionDirectLinks: true,
  autoDismissSeconds: 0, // 0 = persistent banner for maximum visibility
};
