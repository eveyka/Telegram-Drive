import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePeriodicSmartlink } from '../../src/hooks/usePeriodicSmartlink';
import * as sponsorLinks from '../../src/services/sponsorLinks';

const { supporterStatus } = vi.hoisted(() => ({
  supporterStatus: { current: { state: 'inactive', ad_free: false } },
}));

vi.mock('../../src/context/SupporterContext', () => ({
  useSupporter: () => ({ status: supporterStatus.current }),
}));

describe('usePeriodicSmartlink hook', () => {
  let triggerSmartDirectLinkSpy: any;

  beforeEach(() => {
    localStorage.clear();
    supporterStatus.current = { state: 'inactive', ad_free: false };
    triggerSmartDirectLinkSpy = vi.spyOn(sponsorLinks, 'triggerSmartDirectLink').mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers smart direct link on global user interaction for free users', () => {
    renderHook(() => usePeriodicSmartlink());

    window.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(triggerSmartDirectLinkSpy).toHaveBeenCalledWith('periodic_click_smartlink', false);
  });

  it('never triggers smart direct link for Pro users with ad_free or active state', () => {
    supporterStatus.current = { state: 'active', ad_free: true };
    renderHook(() => usePeriodicSmartlink());

    window.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(triggerSmartDirectLinkSpy).not.toHaveBeenCalled();
  });

  it('never triggers smart direct link for locally verified licensed users', () => {
    localStorage.setItem(
      'tg_drive_license_data',
      JSON.stringify({ isLicensed: true, expiresAt: Math.floor(Date.now() / 1000) + 10000 }),
    );

    renderHook(() => usePeriodicSmartlink());

    window.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(triggerSmartDirectLinkSpy).not.toHaveBeenCalled();
  });
});
