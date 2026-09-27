import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DesktopAdBanner, LegacyDesktopAdBanner } from '../../src/components/desktop/dashboard/DesktopAdBanner';

describe('DesktopAdBanner', () => {
  it('renders null when rendered', () => {
    const { container } = render(<DesktopAdBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('legacy component renders null when rendered', () => {
    const { container } = render(<LegacyDesktopAdBanner />);
    expect(container.firstChild).toBeNull();
  });
});
