import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TopBar } from '../../src/components/desktop/dashboard/TopBar';
import { DEFAULT_SEARCH_FILTERS } from '../../src/services/fileSearch';

vi.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: vi.fn() }),
}));

vi.mock('../../src/context/SettingsContext', () => ({
  useSettings: () => ({ settings: { proxyEnabled: false, proxyLiveStateEnabled: false } }),
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, fallback?: any) => (typeof fallback === 'string' ? fallback : key),
    }),
  };
});

describe('TopBar full search conversion and folder scoping', () => {
  const defaultProps = {
    currentFolderName: 'My Documents',
    selectedIds: [],
    onShowMoveModal: vi.fn(),
    onBulkDownload: vi.fn(),
    onBulkDelete: vi.fn(),
    onBulkShare: vi.fn(),
    onDownloadFolder: vi.fn(),
    onClearSelection: vi.fn(),
    onUploadClick: vi.fn(),
    viewMode: 'grid' as const,
    setViewMode: vi.fn(),
    cardScale: 1,
    onCardScaleChange: vi.fn(),
    sortField: 'name' as const,
    sortDirection: 'asc' as const,
    onSortChange: vi.fn(),
    searchTerm: '',
    onSearchChange: vi.fn(),
    onSettingsClick: vi.fn(),
    onRemoteUploadClick: vi.fn(),
    onNewFolderClick: vi.fn(),
    onShowShortcuts: vi.fn(),
    onShowHelp: vi.fn(),
    searchFilters: { ...DEFAULT_SEARCH_FILTERS, scope: 'folder' as const },
    onSearchFiltersChange: vi.fn(),
  };

  it('renders compact search trigger in normal header mode', () => {
    render(<TopBar {...defaultProps} />);
    expect(screen.getByText('My Documents')).toBeDefined();
    expect(screen.getByTitle('Click to search')).toBeDefined();
  });

  it('converts into full search header when clicking search trigger', () => {
    const onToggleSearchExpanded = vi.fn();
    render(<TopBar {...defaultProps} onToggleSearchExpanded={onToggleSearchExpanded} />);

    fireEvent.click(screen.getByTitle('Click to search'));
    expect(onToggleSearchExpanded).toHaveBeenCalledWith(true);
    expect(screen.getByRole('button', { name: /Back \/ Close search/i })).toBeDefined();
    expect(screen.getByPlaceholderText(/Search in "My Documents"/i)).toBeDefined();
  });

  it('allows toggling between current folder and all folders scope', () => {
    const onSearchFiltersChange = vi.fn();
    render(
      <TopBar
        {...defaultProps}
        isSearchExpanded={true}
        onSearchFiltersChange={onSearchFiltersChange}
      />
    );

    const scopeButton = screen.getByTitle('Switch search scope');
    fireEvent.click(scopeButton);

    const allFoldersOption = screen.getByText(/All Folders \(Everywhere\)/i);
    fireEvent.click(allFoldersOption);

    expect(onSearchFiltersChange).toHaveBeenCalledWith(
      expect.objectContaining({ scope: 'all' })
    );
  });

  it('exits search mode and clears search on back/cancel', () => {
    const onSearchChange = vi.fn();
    const onToggleSearchExpanded = vi.fn();
    render(
      <TopBar
        {...defaultProps}
        isSearchExpanded={true}
        searchTerm="invoice"
        onSearchChange={onSearchChange}
        onToggleSearchExpanded={onToggleSearchExpanded}
      />
    );

    const backButton = screen.getByRole('button', { name: /Back \/ Close search/i });
    fireEvent.click(backButton);

    expect(onSearchChange).toHaveBeenCalledWith('');
    expect(onToggleSearchExpanded).toHaveBeenCalledWith(false);
  });
});
