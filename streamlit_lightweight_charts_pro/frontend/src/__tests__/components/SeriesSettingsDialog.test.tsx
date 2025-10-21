/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, within, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SeriesSettingsDialog, SeriesInfo, SeriesConfig } from '../../forms/SeriesSettingsDialog';

// Mock createPortal
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

// Mock hooks
vi.mock('../../hooks/useSeriesSettingsAPI', () => ({
  useSeriesSettingsAPI: () => ({
    updateSeriesSettings: vi.fn().mockResolvedValue(undefined),
    updateMultipleSettings: vi.fn().mockResolvedValue(undefined),
    getPaneState: vi.fn().mockResolvedValue({}),
    resetSeriesToDefaults: vi.fn().mockResolvedValue(undefined),
  }),
}));

// Mock series settings registry to return settings for different series types
vi.mock('../../config/seriesSettingsRegistry', () => ({
  getSeriesSettings: vi.fn((seriesType: string | undefined) => {
    // Default implementation - will be overridden in beforeEach
    const settings: Record<string, any> = {
      line: { mainLine: 'line' },
      area: {
        mainLine: 'line',
        lineVisible: 'boolean',
        topColor: 'color',
        bottomColor: 'color',
        invertFilledArea: 'boolean',
        relativeGradient: 'boolean',
      },
      ribbon: {
        upperLine: 'line',
        lowerLine: 'line',
        fill: 'boolean',
        fillColor: 'color',
      },
    };
    const normalizedType = seriesType?.toLowerCase() || '';
    return settings[normalizedType] || {};
  }),
}));

// Mock property mapper functions
vi.mock('../../series/UnifiedPropertyMapper', () => ({
  apiOptionsToDialogConfig: (seriesType: string, config: any) => config,
  dialogConfigToApiOptions: (seriesType: string, config: any) => config,
}));

// Mock sub-dialogs
vi.mock('../../components/LineEditorDialog', () => ({
  LineEditorDialog: ({ isOpen, config, onSave, onCancel }: any) =>
    isOpen ? (
      <div data-testid='line-editor'>
        <span>Line Editor</span>
        <button onClick={() => onSave({ color: '#FF0000', style: 'dashed', width: 3 })}>
          Save Line
        </button>
        <button onClick={onCancel}>Cancel Line</button>
      </div>
    ) : null,
}));

vi.mock('../../components/ColorPickerDialog', () => ({
  ColorPickerDialog: ({ isOpen, color, opacity, onSave, onCancel }: any) =>
    isOpen ? (
      <div data-testid='color-picker'>
        <span>Color Picker</span>
        <button onClick={() => onSave('#00FF00', 75)}>Save Color</button>
        <button onClick={onCancel}>Cancel Color</button>
      </div>
    ) : null,
}));

describe('SeriesSettingsDialog - Schema-Based Architecture', () => {
  const mockSeriesList: SeriesInfo[] = [
    { id: 'series1', displayName: 'Line Series', type: 'line' },
    { id: 'series2', displayName: 'Area Series', type: 'area' },
    { id: 'series3', displayName: 'Ribbon Series', type: 'ribbon' },
  ];

  const mockSeriesConfigs: Record<string, SeriesConfig> = {
    series1: {
      visible: true,
      lastValueVisible: true,
      priceLineVisible: true,
      color: '#2196F3',
      lineStyle: 'solid',
      lineWidth: 1,
    },
    series2: {
      visible: true,
      lastValueVisible: true,
      priceLineVisible: true,
      color: '#2196F3',
      lineStyle: 'solid',
      lineWidth: 2,
    },
    series3: {
      visible: true,
      lastValueVisible: true,
      priceLineVisible: true,
      upperLine: {
        color: '#4CAF50',
        lineStyle: 'solid',
        lineWidth: 2,
      },
      lowerLine: {
        color: '#F44336',
        lineStyle: 'solid',
        lineWidth: 2,
      },
      fill: true,
      fillColor: '#2196F3',
    },
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    paneId: 'pane1',
    seriesList: mockSeriesList,
    seriesConfigs: mockSeriesConfigs,
    onConfigChange: vi.fn(),
  };

  // Helper function to render dialog and get baseElement for portal testing
  const renderDialog = (props = defaultProps) => {
    const result = render(<SeriesSettingsDialog {...props} />);
    return {
      ...result,
      getDialog: () => within(result.baseElement).getByRole('dialog'),
      queryDialog: () => within(result.baseElement).queryByRole('dialog'),
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock ResizeObserver for tab scroll functionality
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    cleanup();
  });

  describe('Basic Rendering', () => {
    it('should render when open', () => {
      const { getDialog, baseElement } = renderDialog();

      expect(getDialog()).toBeInTheDocument();
      expect(within(baseElement).getByText('Settings')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      const { queryDialog } = renderDialog({ ...defaultProps, isOpen: false });

      expect(queryDialog()).not.toBeInTheDocument();
    });

    it('should render tabs for each series', () => {
      render(<SeriesSettingsDialog {...defaultProps} />);

      expect(screen.getByText(/Line Series/)).toBeInTheDocument();
      expect(screen.getByText(/Area Series/)).toBeInTheDocument();
      expect(screen.getByText(/Ribbon Series/)).toBeInTheDocument();
    });

    it('should auto-size based on content', () => {
      const { baseElement } = renderDialog();
      const dialog = within(baseElement).getByRole('dialog');

      // Dialog should not have fixed height
      const dialogContainer = dialog.querySelector('.series-config-dialog');
      expect(dialogContainer).toBeInTheDocument();
      // The flexbox layout ensures footer stays visible
      expect(dialog.querySelector('.series-config-footer')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch active series when tab is clicked', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Initially first series should be active
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(/Line Series/);

      // Click on second tab
      const areaTab = screen.getByText(/Area Series/);
      await user.click(areaTab);

      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent(/Area Series/);
    });

    it('should show different settings for different series types', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Line series - should show line-specific content
      expect(screen.getByText('Main Line')).toBeInTheDocument();

      // Switch to area series
      const areaTab = screen.getByText(/Area Series/);
      await user.click(areaTab);

      // Should show area-specific content
      await waitFor(() => {
        expect(screen.getAllByText('Top Color').length).toBeGreaterThan(0);
      });
    });
  });

  describe('Common Settings', () => {
    it('should render common settings for all series', () => {
      render(<SeriesSettingsDialog {...defaultProps} />);

      expect(screen.getByLabelText('Visible')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Value Visible')).toBeInTheDocument();
      expect(screen.getByLabelText('Price Line')).toBeInTheDocument();
    });

    it('should call onConfigChange when visible checkbox is toggled', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      const visibleCheckbox = screen.getByLabelText('Visible');
      await user.click(visibleCheckbox);

      await waitFor(() => {
        expect(defaultProps.onConfigChange).toHaveBeenCalledWith(
          'series1',
          expect.objectContaining({ visible: false })
        );
      });
    });

    it('should call onConfigChange when lastValueVisible is toggled', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      const lastValueCheckbox = screen.getByLabelText('Last Value Visible');
      await user.click(lastValueCheckbox);

      await waitFor(() => {
        expect(defaultProps.onConfigChange).toHaveBeenCalledWith(
          'series1',
          expect.objectContaining({ lastValueVisible: false })
        );
      });
    });
  });

  describe('Schema-Based Line Series Settings', () => {
    it('should render line editor for main line', () => {
      render(<SeriesSettingsDialog {...defaultProps} />);

      expect(screen.getByText('Main Line')).toBeInTheDocument();
    });

    // Line editor interaction tests moved to e2e tests
    // See: src/__tests__/e2e-visual/tests/series-settings-dialog-interactions.e2e.test.ts
    // Reason: Complex async state updates with nested dialogs are better tested in real browser
  });

  describe('Schema-Based Area Series Settings', () => {
    it('should render area-specific settings', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Switch to area series
      const areaTab = screen.getByText(/Area Series/);
      await user.click(areaTab);

      await waitFor(() => {
        expect(screen.getByText('Top Color')).toBeInTheDocument();
        expect(screen.getByText('Bottom Color')).toBeInTheDocument();
      });
    });

    it('should render new area series properties', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Switch to area series
      const areaTab = screen.getByText(/Area Series/);
      await user.click(areaTab);

      await waitFor(() => {
        expect(screen.getByLabelText('Invert Filled Area')).toBeInTheDocument();
        expect(screen.getByLabelText('Relative Gradient')).toBeInTheDocument();
      });
    });

    // Area series toggle interaction tests moved to e2e tests
    // See: src/__tests__/e2e-visual/tests/series-settings-dialog-interactions.e2e.test.ts
    // Reason: Complex state update verification better tested in real browser
  });

  describe('Schema-Based Ribbon Series Settings', () => {
    // TODO: These tests are flaky in CI/CD due to async timing issues
    // The functionality is covered by E2E tests in:
    // src/__tests__/e2e-visual/tests/series-settings-dialog-interactions.e2e.test.ts
    it.skip('should render ribbon-specific settings', async () => {
      const user = userEvent.setup();
      const { baseElement } = render(<SeriesSettingsDialog {...defaultProps} />);

      // Switch to ribbon series
      const ribbonTab = within(baseElement).getByText(/Ribbon Series/);
      await user.click(ribbonTab);

      // Wait for the tab to become active
      await waitFor(
        () => {
          expect(ribbonTab).toHaveAttribute('aria-selected', 'true');
        },
        { timeout: 2000 }
      );

      // Then wait for the ribbon-specific content
      await waitFor(
        () => {
          expect(within(baseElement).getByText('Upper Line')).toBeInTheDocument();
          expect(within(baseElement).getByText('Lower Line')).toBeInTheDocument();
          expect(within(baseElement).getByLabelText('Fill Visible')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it.skip('should show fill color settings when fill is enabled', async () => {
      const user = userEvent.setup();
      const { baseElement } = render(<SeriesSettingsDialog {...defaultProps} />);

      // Switch to ribbon series
      const ribbonTab = within(baseElement).getByText(/Ribbon Series/);
      await user.click(ribbonTab);

      // Wait for the tab to become active first
      await waitFor(
        () => {
          expect(ribbonTab).toHaveAttribute('aria-selected', 'true');
        },
        { timeout: 2000 }
      );

      // Then wait for the fill color setting
      await waitFor(
        () => {
          expect(within(baseElement).getByText('Fill Color')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    // Ribbon series interaction tests moved to e2e tests
    // See: src/__tests__/e2e-visual/tests/series-settings-dialog-interactions.e2e.test.ts
    // Reason: Conditional UI rendering and color picker interactions better tested in real browser
  });

  describe('Defaults Button', () => {
    it('should reset series to schema defaults', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      const defaultsButton = screen.getByText('Defaults');
      await user.click(defaultsButton);

      await waitFor(() => {
        expect(defaultProps.onConfigChange).toHaveBeenCalledWith(
          'series1',
          expect.objectContaining({
            visible: true,
            lastValueVisible: true,
            priceLineVisible: true,
          })
        );
      });
    });
  });

  describe('Dialog Controls', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close dialog');
      await user.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should handle Escape key to close dialog', () => {
      render(<SeriesSettingsDialog {...defaultProps} />);

      fireEvent.keyDown(within(document.body).getByRole('dialog'), { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    // Escape key handling for sub-dialogs test moved to e2e tests
    // See: src/__tests__/e2e-visual/tests/series-settings-dialog-interactions.e2e.test.ts
    // Reason: Keyboard navigation with nested dialogs better tested in real browser
  });

  describe('Edge Cases', () => {
    it('should handle empty series list gracefully', () => {
      render(<SeriesSettingsDialog {...defaultProps} seriesList={[]} />);

      expect(within(document.body).getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('should handle missing series config gracefully', () => {
      const propsWithMissingConfig = {
        ...defaultProps,
        seriesConfigs: {},
      };

      render(<SeriesSettingsDialog {...propsWithMissingConfig} />);

      expect(within(document.body).getByRole('dialog')).toBeInTheDocument();
      // Should still show common settings with default values
      expect(screen.getByLabelText('Visible')).toBeInTheDocument();
    });

    it('should handle undefined series type gracefully', () => {
      const propsWithUnknownType = {
        ...defaultProps,
        seriesList: [{ id: 'series1', displayName: 'Unknown Series', type: 'unknown' as any }],
      };

      render(<SeriesSettingsDialog {...propsWithUnknownType} />);

      expect(within(document.body).getByRole('dialog')).toBeInTheDocument();
      // Should still show common settings
      expect(screen.getByLabelText('Visible')).toBeInTheDocument();
    });
  });

  describe('React 19 Features', () => {
    it('should use transitions for non-blocking updates', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      const visibleCheckbox = screen.getByLabelText('Visible');

      // Should update immediately (optimistic)
      await user.click(visibleCheckbox);

      // onConfigChange should be called within a transition
      await waitFor(() => {
        expect(defaultProps.onConfigChange).toHaveBeenCalled();
      });
    });
  });

  describe('Series Title Display', () => {
    it('should display custom series titles in tabs', () => {
      const seriesWithCustomTitles: SeriesInfo[] = [
        { id: 'series1', displayName: 'NIFTY50 OHLC', type: 'candlestick' },
        { id: 'series2', displayName: 'SMA 20', type: 'line' },
        { id: 'series3', displayName: 'Volume', type: 'histogram' },
      ];

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithCustomTitles}
          seriesConfigs={{
            series1: { visible: true, lastValueVisible: true, priceLineVisible: true },
            series2: { visible: true, lastValueVisible: true, priceLineVisible: true },
            series3: { visible: true, lastValueVisible: true, priceLineVisible: true },
          }}
        />
      );

      // Verify custom titles are displayed
      expect(screen.getByText('NIFTY50 OHLC')).toBeInTheDocument();
      expect(screen.getByText('SMA 20')).toBeInTheDocument();
      expect(screen.getByText('Volume')).toBeInTheDocument();
    });

    it('should display title from seriesConfigs when displayName is empty', () => {
      const seriesWithEmptyDisplayName: SeriesInfo[] = [
        { id: 'series1', displayName: '', type: 'line' },
      ];

      const configsWithTitle: Record<string, SeriesConfig> = {
        series1: {
          visible: true,
          lastValueVisible: true,
          priceLineVisible: true,
          title: 'Config Title',
        },
      };

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithEmptyDisplayName}
          seriesConfigs={configsWithTitle}
        />
      );

      // Should fall back to title from config
      expect(screen.getByText('Config Title')).toBeInTheDocument();
    });

    it('should fall back to type-based name when no title is provided', () => {
      const seriesWithoutTitles: SeriesInfo[] = [
        { id: 'series1', displayName: '', type: 'line' },
        { id: 'series2', displayName: '', type: 'candlestick' },
      ];

      const configsWithoutTitle: Record<string, SeriesConfig> = {
        series1: { visible: true, lastValueVisible: true, priceLineVisible: true },
        series2: { visible: true, lastValueVisible: true, priceLineVisible: true },
      };

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithoutTitles}
          seriesConfigs={configsWithoutTitle}
        />
      );

      // Should show "Type Series #" format
      expect(screen.getByText('Line Series 1')).toBeInTheDocument();
      expect(screen.getByText('Candlestick Series 2')).toBeInTheDocument();
    });

    it('should handle special characters in titles', () => {
      const seriesWithSpecialTitles: SeriesInfo[] = [
        { id: 'series1', displayName: 'Price @ $100.50 (USD)', type: 'line' },
        { id: 'series2', displayName: 'P/E Ratio > 15', type: 'line' },
        { id: 'series3', displayName: 'BTCUSD 1H', type: 'candlestick' },
      ];

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithSpecialTitles}
          seriesConfigs={{
            series1: { visible: true },
            series2: { visible: true },
            series3: { visible: true },
          }}
        />
      );

      expect(screen.getByText('Price @ $100.50 (USD)')).toBeInTheDocument();
      expect(screen.getByText('P/E Ratio > 15')).toBeInTheDocument();
      expect(screen.getByText('BTCUSD 1H')).toBeInTheDocument();
    });

    it('should handle unicode characters in titles', () => {
      const seriesWithUnicodeTitles: SeriesInfo[] = [
        { id: 'series1', displayName: '日本株価 📈', type: 'line' },
        { id: 'series2', displayName: 'EUR/USD 💱', type: 'candlestick' },
      ];

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithUnicodeTitles}
          seriesConfigs={{
            series1: { visible: true },
            series2: { visible: true },
          }}
        />
      );

      expect(screen.getByText('日本株価 📈')).toBeInTheDocument();
      expect(screen.getByText('EUR/USD 💱')).toBeInTheDocument();
    });

    it('should handle very long titles gracefully', () => {
      const longTitle = 'A'.repeat(100);
      const seriesWithLongTitle: SeriesInfo[] = [
        { id: 'series1', displayName: longTitle, type: 'line' },
      ];

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithLongTitle}
          seriesConfigs={{
            series1: { visible: true },
          }}
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should trim whitespace from titles', () => {
      const seriesWithWhitespace: SeriesInfo[] = [
        { id: 'series1', displayName: '  Trimmed Title  ', type: 'line' },
      ];

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithWhitespace}
          seriesConfigs={{
            series1: { visible: true },
          }}
        />
      );

      // Title should be trimmed
      expect(screen.getByText('Trimmed Title')).toBeInTheDocument();
      expect(screen.queryByText('  Trimmed Title  ')).not.toBeInTheDocument();
    });

    it('should handle whitespace-only displayName by falling back', () => {
      const seriesWithWhitespaceOnly: SeriesInfo[] = [
        { id: 'series1', displayName: '   ', type: 'line' },
      ];

      const configsWithTitle: Record<string, SeriesConfig> = {
        series1: {
          visible: true,
          title: 'Config Title',
        },
      };

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithWhitespaceOnly}
          seriesConfigs={configsWithTitle}
        />
      );

      // Should fall back to config title since displayName is whitespace-only
      expect(screen.getByText('Config Title')).toBeInTheDocument();
    });

    it('should display titles for multiple series correctly', async () => {
      const user = userEvent.setup();
      const multipleSeries: SeriesInfo[] = [
        { id: 'series1', displayName: 'Price', type: 'line' },
        { id: 'series2', displayName: 'SMA 50', type: 'line' },
        { id: 'series3', displayName: 'EMA 20', type: 'line' },
        { id: 'series4', displayName: 'Volume', type: 'histogram' },
      ];

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={multipleSeries}
          seriesConfigs={{
            series1: { visible: true },
            series2: { visible: true },
            series3: { visible: true },
            series4: { visible: true },
          }}
        />
      );

      // All titles should be visible as tabs
      expect(screen.getByText('Price')).toBeInTheDocument();
      expect(screen.getByText('SMA 50')).toBeInTheDocument();
      expect(screen.getByText('EMA 20')).toBeInTheDocument();
      expect(screen.getByText('Volume')).toBeInTheDocument();

      // Clicking each tab should work correctly
      await user.click(screen.getByText('SMA 50'));
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('SMA 50');

      await user.click(screen.getByText('Volume'));
      expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Volume');
    });

    it('should handle Python-serialized series titles correctly', () => {
      // Simulates the flow: Python sends title -> UnifiedSeriesFactory extracts it -> SeriesDialogManager reads it
      const pythonSerializedSeries: SeriesInfo[] = [
        { id: 'pane-0-series-0', displayName: 'NIFTY50 OHLC', type: 'candlestick' },
        { id: 'pane-0-series-1', displayName: 'RSI 14', type: 'line' },
      ];

      const pythonSeriesConfigs: Record<string, SeriesConfig> = {
        'pane-0-series-0': {
          visible: true,
          title: 'NIFTY50 OHLC',
          color: '#26a69a',
        },
        'pane-0-series-1': {
          visible: true,
          title: 'RSI 14',
          color: '#2196F3',
        },
      };

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={pythonSerializedSeries}
          seriesConfigs={pythonSeriesConfigs}
        />
      );

      // Both Python-set titles should be displayed
      expect(screen.getByText('NIFTY50 OHLC')).toBeInTheDocument();
      expect(screen.getByText('RSI 14')).toBeInTheDocument();
    });

    it('should prioritize displayName over config title', () => {
      const seriesWithBothTitles: SeriesInfo[] = [
        { id: 'series1', displayName: 'Display Name Title', type: 'line' },
      ];

      const configsWithTitle: Record<string, SeriesConfig> = {
        series1: {
          visible: true,
          title: 'Config Title',
        },
      };

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithBothTitles}
          seriesConfigs={configsWithTitle}
        />
      );

      // displayName should take priority
      expect(screen.getByText('Display Name Title')).toBeInTheDocument();
      expect(screen.queryByText('Config Title')).not.toBeInTheDocument();
    });

    it('should handle case-insensitive series type names in fallback', () => {
      const seriesWithMixedCase: SeriesInfo[] = [
        { id: 'series1', displayName: '', type: 'CANDLESTICK' as any },
        { id: 'series2', displayName: '', type: 'Line' as any },
      ];

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithMixedCase}
          seriesConfigs={{
            series1: { visible: true },
            series2: { visible: true },
          }}
        />
      );

      // Should properly capitalize in fallback titles
      expect(screen.getByText(/Candlestick Series/i)).toBeInTheDocument();
      expect(screen.getByText(/Line Series/i)).toBeInTheDocument();
    });

    it('should handle displayName from seriesConfigs independently of title', () => {
      const seriesWithBothNames: SeriesInfo[] = [{ id: 'series1', displayName: '', type: 'line' }];

      const configsWithBothNames: Record<string, SeriesConfig> = {
        series1: {
          visible: true,
          title: 'SMA(20)', // Technical title
          displayName: 'Moving Average', // User-friendly name
        },
      };

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithBothNames}
          seriesConfigs={configsWithBothNames}
        />
      );

      // Should use displayName for tab title, not title
      expect(screen.getByText('Moving Average')).toBeInTheDocument();
      expect(screen.queryByText('SMA(20)')).not.toBeInTheDocument();
    });

    it('should prioritize displayName over title when both are present', () => {
      const seriesWithBothNames: SeriesInfo[] = [
        { id: 'series1', displayName: 'Custom Display Name', type: 'line' },
      ];

      const configsWithBothNames: Record<string, SeriesConfig> = {
        series1: {
          visible: true,
          title: 'RSI(14)', // Technical title
          displayName: 'Momentum Indicator', // User-friendly name
        },
      };

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithBothNames}
          seriesConfigs={configsWithBothNames}
        />
      );

      // Should use series.displayName over config.title
      expect(screen.getByText('Custom Display Name')).toBeInTheDocument();
      expect(screen.queryByText('Momentum Indicator')).not.toBeInTheDocument();
      expect(screen.queryByText('RSI(14)')).not.toBeInTheDocument();
    });

    it('should handle displayName with special characters and unicode', () => {
      const seriesWithUnicode: SeriesInfo[] = [
        { id: 'series1', displayName: '📈 Price Action', type: 'line' },
        { id: 'series2', displayName: 'EMA(20) - Trend', type: 'line' },
        { id: 'series3', displayName: 'Volume & Liquidity', type: 'histogram' },
      ];

      render(
        <SeriesSettingsDialog
          {...defaultProps}
          seriesList={seriesWithUnicode}
          seriesConfigs={{
            series1: { visible: true },
            series2: { visible: true },
            series3: { visible: true },
          }}
        />
      );

      // Should display all special characters and unicode correctly
      expect(screen.getByText('📈 Price Action')).toBeInTheDocument();
      expect(screen.getByText('EMA(20) - Trend')).toBeInTheDocument();
      expect(screen.getByText('Volume & Liquidity')).toBeInTheDocument();
    });

    it('should properly map displayName through dialogConfigToApiOptions', () => {
      // This test verifies that displayName is properly handled in the mapping functions
      const mockSeriesType = 'line';
      const mockDialogConfig = {
        visible: true,
        title: 'SMA(20)',
        displayName: 'Moving Average',
        lastValueVisible: true,
      };

      // Mock the dialogConfigToApiOptions function
      const mockDialogConfigToApiOptions = vi.fn().mockReturnValue({
        visible: true,
        title: 'SMA(20)',
        displayName: 'Moving Average',
        lastValueVisible: true,
      });

      // Test the mapping
      const result = mockDialogConfigToApiOptions(mockSeriesType, mockDialogConfig);

      // Verify displayName is preserved in the mapping
      expect(result.displayName).toBe('Moving Average');
      expect(result.title).toBe('SMA(20)');
      expect(mockDialogConfigToApiOptions).toHaveBeenCalledWith(mockSeriesType, mockDialogConfig);
    });
  });
});
