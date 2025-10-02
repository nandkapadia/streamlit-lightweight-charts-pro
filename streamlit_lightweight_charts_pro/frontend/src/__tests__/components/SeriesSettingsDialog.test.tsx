/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { SeriesSettingsDialog, SeriesInfo, SeriesConfig } from '../../forms/SeriesSettingsDialog';

// Mock createPortal
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

// Mock hooks
vi.mock('../../hooks/useSeriesSettingsAPI', () => ({
  useSeriesSettingsAPI: () => ({
    updateSeriesSettings: vi.fn(),
  }),
}));

vi.mock('../../hooks/useChartFormActions', () => ({
  useChartFormActions: () => ({
    applySettingsAction: vi.fn(),
    isSubmitting: false,
  }),
}));

vi.mock('../../hooks/useOptimisticChartUpdates', () => ({
  useOptimisticChartUpdates: (configs: Record<string, SeriesConfig>) => ({
    optimisticConfigs: configs,
    updateOptimisticConfig: vi.fn(),
  }),
}));

// Mock sub-dialogs
vi.mock('../../components/LineEditorDialog', () => ({
  LineEditorDialog: ({ isOpen, config, onSave, onCancel }: any) =>
    isOpen ? (
      <div data-testid="line-editor">
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
      <div data-testid="color-picker">
        <span>Color Picker</span>
        <button onClick={() => onSave('#00FF00', 75)}>Save Color</button>
        <button onClick={onCancel}>Cancel Color</button>
      </div>
    ) : null,
}));

describe('SeriesSettingsDialog', () => {
  const mockSeriesList: SeriesInfo[] = [
    { id: 'series1', displayName: 'Line Series', type: 'line' },
    { id: 'series2', displayName: 'Ribbon Series', type: 'ribbon' },
  ];

  const mockSeriesConfigs: Record<string, SeriesConfig> = {
    series1: {
      visible: true,
      markers: false,
      last_value_visible: true,
      price_line: true,
      color: '#2196F3',
      line_style: 'solid',
      line_width: 1,
    },
    series2: {
      visible: true,
      markers: false,
      last_value_visible: true,
      price_line: true,
      upper_line: {
        color: '#4CAF50',
        line_style: 'solid',
        line_width: 2,
      },
      lower_line: {
        color: '#F44336',
        line_style: 'solid',
        line_width: 2,
      },
      fill: true,
      fill_color: '#2196F3',
      fill_opacity: 20,
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
  });

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

    expect(screen.getByText('Line Series 1')).toBeInTheDocument();
    expect(screen.getByText('Ribbon Series 2')).toBeInTheDocument();
  });

  it('should switch active series when tab is clicked', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    // Initially first series should be active
    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Line Series 1');

    // Click on second tab
    const ribbonTab = screen.getByText('Ribbon Series 2');
    await user.click(ribbonTab);

    expect(screen.getByRole('tab', { selected: true })).toHaveTextContent('Ribbon Series 2');
  });

  it('should render common settings for all series', () => {
    render(<SeriesSettingsDialog {...defaultProps} />);

    expect(screen.getByLabelText('Series visible')).toBeInTheDocument();
    expect(screen.getByLabelText('Show markers')).toBeInTheDocument();
    expect(screen.getByLabelText('Show last value')).toBeInTheDocument();
    expect(screen.getByLabelText('Show price line')).toBeInTheDocument();
  });

  it('should render line-specific settings for line series', () => {
    render(<SeriesSettingsDialog {...defaultProps} />);

    // Should show line settings section
    expect(screen.getByText('Line Settings')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit line settings')).toBeInTheDocument();
  });

  it('should render ribbon-specific settings for ribbon series', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    // Switch to ribbon series
    const ribbonTab = screen.getByText('Ribbon Series 2');
    await user.click(ribbonTab);

    expect(screen.getByText('Ribbon Settings')).toBeInTheDocument();
    expect(screen.getByText('Upper Line')).toBeInTheDocument();
    expect(screen.getByText('Lower Line')).toBeInTheDocument();
    expect(screen.getByLabelText('Show fill area')).toBeInTheDocument();
  });

  it('should call onConfigChange when common setting is changed', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    const visibleCheckbox = screen.getByLabelText('Series visible');
    await user.click(visibleCheckbox);

    expect(defaultProps.onConfigChange).toHaveBeenCalledWith('series1', { visible: false });
  });

  it('should open line editor when line row is clicked', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    const lineRow = screen.getByLabelText('Edit line settings');
    await user.click(lineRow);

    expect(screen.getByTestId('line-editor')).toBeInTheDocument();
  });

  it('should update configuration when line editor saves', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    // Open line editor
    const lineRow = screen.getByLabelText('Edit line settings');
    await user.click(lineRow);

    // Save in line editor
    const saveLineButton = screen.getByText('Save Line');
    await user.click(saveLineButton);

    expect(defaultProps.onConfigChange).toHaveBeenCalledWith('series1', {
      color: '#FF0000',
      line_style: 'dashed',
      line_width: 3,
    });

    expect(screen.queryByTestId('line-editor')).not.toBeInTheDocument();
  });

  it('should open color picker for fill color in ribbon series', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    // Switch to ribbon series
    const ribbonTab = screen.getByText('Ribbon Series 2');
    await user.click(ribbonTab);

    // Click on fill color
    const fillColorRow = screen.getByLabelText('Edit fill color');
    await user.click(fillColorRow);

    expect(screen.getByTestId('color-picker')).toBeInTheDocument();
  });

  it('should update fill color when color picker saves', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    // Switch to ribbon series
    const ribbonTab = screen.getByText('Ribbon Series 2');
    await user.click(ribbonTab);

    // Open color picker
    const fillColorRow = screen.getByLabelText('Edit fill color');
    await user.click(fillColorRow);

    // Save in color picker
    const saveColorButton = screen.getByText('Save Color');
    await user.click(saveColorButton);

    expect(defaultProps.onConfigChange).toHaveBeenCalledWith('series2', {
      fill_color: '#00FF00',
      fill_opacity: 75,
    });

    expect(screen.queryByTestId('color-picker')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close dialog');
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onClose when OK button is clicked', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    const okButton = screen.getByText('OK');
    await user.click(okButton);

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

  it('should handle Escape key to close sub-dialogs first', () => {
    render(<SeriesSettingsDialog {...defaultProps} />);

    // Open line editor first
    const lineRow = screen.getByLabelText('Edit line settings');
    fireEvent.click(lineRow);

    expect(screen.getByTestId('line-editor')).toBeInTheDocument();

    // Press Escape - should close line editor, not main dialog
    fireEvent.keyDown(within(document.body).getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByTestId('line-editor')).not.toBeInTheDocument();
    expect(within(document.body).getByRole('dialog')).toBeInTheDocument();
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should reset series to defaults when Defaults button is clicked', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    const defaultsButton = screen.getByText('Defaults');
    await user.click(defaultsButton);

    expect(defaultProps.onConfigChange).toHaveBeenCalledWith('series1', expect.objectContaining({
      visible: true,
      markers: false,
      last_value_visible: true,
      price_line: true,
      color: '#2196F3',
      line_style: 'solid',
      line_width: 1,
    }));
  });

  it('should handle backdrop click when no sub-dialogs are open', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    const overlay = document.querySelector('.series-config-overlay');
    if (overlay) {
      // Click the overlay directly, not a child element
      await user.click(overlay);
    }

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should not close on backdrop click when sub-dialog is open', async () => {
    const user = userEvent.setup();
    render(<SeriesSettingsDialog {...defaultProps} />);

    // Open line editor
    const lineRow = screen.getByLabelText('Edit line settings');
    await user.click(lineRow);

    // Click backdrop - should not close main dialog
    const overlay = within(document.body).getByRole('dialog').parentElement;
    if (overlay) {
      await user.click(overlay);
    }

    expect(defaultProps.onClose).not.toHaveBeenCalled();
    expect(within(document.body).getByRole('dialog')).toBeInTheDocument();
  });

  it('should show fill color section only when fill is enabled', async () => {
    const user = userEvent.setup();

    // Start with fill enabled to ensure the checkbox is rendered
    const propsWithFillEnabled = {
      ...defaultProps,
      seriesConfigs: {
        ...mockSeriesConfigs,
        series2: {
          ...mockSeriesConfigs.series2,
          fill: true,
        },
      },
    };

    const { unmount } = render(<SeriesSettingsDialog {...propsWithFillEnabled} />);

    // Switch to ribbon series
    const ribbonTab = screen.getByText('Ribbon Series 2');
    await act(async () => {
      await user.click(ribbonTab);
    });

    // Fill color row should be visible when fill is enabled
    expect(screen.getByText('Fill Color')).toBeInTheDocument();

    // Disable fill
    const fillCheckbox = screen.getByLabelText('Show fill area');
    await act(async () => {
      await user.click(fillCheckbox);
    });

    // Fill color row should now be hidden
    expect(screen.queryByText('Fill Color')).not.toBeInTheDocument();

    // Clean up
    unmount();
  });

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
    expect(screen.getByLabelText('Series visible')).toBeInTheDocument();
  });
});
