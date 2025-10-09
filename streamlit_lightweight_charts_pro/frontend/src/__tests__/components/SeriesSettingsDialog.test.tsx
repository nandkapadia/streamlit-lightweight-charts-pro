/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
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
    getPaneState: vi.fn().mockResolvedValue({}),
  }),
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
      lineStyle: 0,
      lineWidth: 1,
    },
    series2: {
      visible: true,
      lastValueVisible: true,
      priceLineVisible: true,
      color: '#2196F3',
      lineStyle: 0,
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
      fillOpacity: 20,
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

      // Line series - should show Line Settings
      expect(screen.getByText('Line Settings')).toBeInTheDocument();

      // Switch to area series
      const areaTab = screen.getByText(/Area Series/);
      await user.click(areaTab);

      // Should show Fill Settings
      await waitFor(() => {
        expect(screen.getByText('Fill Settings')).toBeInTheDocument();
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
        expect(defaultProps.onConfigChange).toHaveBeenCalledWith('series1',
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
        expect(defaultProps.onConfigChange).toHaveBeenCalledWith('series1',
          expect.objectContaining({ lastValueVisible: false })
        );
      });
    });
  });

  describe('Schema-Based Line Series Settings', () => {
    it('should render line editor for main line', () => {
      render(<SeriesSettingsDialog {...defaultProps} />);

      expect(screen.getByText('Line Settings')).toBeInTheDocument();
      expect(screen.getByText('Line')).toBeInTheDocument();
    });

    it('should open line editor when line row is clicked', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      const lineRow = screen.getByText('Line').closest('[role="button"]');
      expect(lineRow).toBeInTheDocument();

      if (lineRow) {
        await user.click(lineRow);
        expect(screen.getByTestId('line-editor')).toBeInTheDocument();
      }
    });

    it('should update mainLine config when line editor saves', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Open line editor
      const lineRow = screen.getByText('Line').closest('[role="button"]');
      if (lineRow) {
        await user.click(lineRow);
      }

      // Save in line editor
      const saveButton = screen.getByText('Save Line');
      await user.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onConfigChange).toHaveBeenCalledWith('series1',
          expect.objectContaining({
            mainLine: expect.objectContaining({
              color: '#FF0000',
              lineStyle: 'dashed',
              lineWidth: 3,
            }),
          })
        );
      });

      expect(screen.queryByTestId('line-editor')).not.toBeInTheDocument();
    });
  });

  describe('Schema-Based Area Series Settings', () => {
    it('should render area-specific settings', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Switch to area series
      const areaTab = screen.getByText(/Area Series/);
      await user.click(areaTab);

      await waitFor(() => {
        expect(screen.getByText('Fill Settings')).toBeInTheDocument();
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

    it('should toggle invertFilledArea property', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Switch to area series
      const areaTab = screen.getByText(/Area Series/);
      await user.click(areaTab);

      await waitFor(async () => {
        const invertCheckbox = screen.getByLabelText('Invert Filled Area');
        await user.click(invertCheckbox);
      });

      await waitFor(() => {
        expect(defaultProps.onConfigChange).toHaveBeenCalledWith('series2',
          expect.objectContaining({ invertFilledArea: true })
        );
      });
    });

    it('should toggle relativeGradient property', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Switch to area series
      const areaTab = screen.getByText(/Area Series/);
      await user.click(areaTab);

      await waitFor(async () => {
        const relativeCheckbox = screen.getByLabelText('Relative Gradient');
        await user.click(relativeCheckbox);
      });

      await waitFor(() => {
        expect(defaultProps.onConfigChange).toHaveBeenCalledWith('series2',
          expect.objectContaining({ relativeGradient: true })
        );
      });
    });
  });

  describe('Schema-Based Ribbon Series Settings', () => {
    it('should render ribbon-specific settings', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Switch to ribbon series
      const ribbonTab = screen.getByText(/Ribbon Series/);
      await user.click(ribbonTab);

      await waitFor(() => {
        expect(screen.getByText('Ribbon Settings')).toBeInTheDocument();
        expect(screen.getByText('Upper Line')).toBeInTheDocument();
        expect(screen.getByText('Lower Line')).toBeInTheDocument();
        expect(screen.getByLabelText('Fill')).toBeInTheDocument();
      });
    });

    it('should show fill color settings when fill is enabled', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Switch to ribbon series
      const ribbonTab = screen.getByText(/Ribbon Series/);
      await user.click(ribbonTab);

      await waitFor(() => {
        expect(screen.getByText('Fill Settings')).toBeInTheDocument();
        expect(screen.getByText('Fill Color')).toBeInTheDocument();
      });
    });

    it('should hide fill color settings when fill is disabled', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Switch to ribbon series
      const ribbonTab = screen.getByText(/Ribbon Series/);
      await user.click(ribbonTab);

      // Disable fill
      await waitFor(async () => {
        const fillCheckbox = screen.getByLabelText('Fill');
        await user.click(fillCheckbox);
      });

      await waitFor(() => {
        expect(screen.queryByText('Fill Color')).not.toBeInTheDocument();
      });
    });

    it('should open color picker for fill color', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Switch to ribbon series
      const ribbonTab = screen.getByText(/Ribbon Series/);
      await user.click(ribbonTab);

      await waitFor(async () => {
        const fillColorRow = screen.getByText('Fill Color').closest('[role="button"]');
        if (fillColorRow) {
          await user.click(fillColorRow);
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('color-picker')).toBeInTheDocument();
      });
    });
  });

  describe('Defaults Button', () => {
    it('should reset series to schema defaults', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      const defaultsButton = screen.getByText('Defaults');
      await user.click(defaultsButton);

      await waitFor(() => {
        expect(defaultProps.onConfigChange).toHaveBeenCalledWith('series1',
          expect.objectContaining({
            visible: true,
            lastValueVisible: true,
            priceLineVisible: true,
            mainLine: expect.objectContaining({
              color: '#2196F3',
              lineStyle: 'solid',
              lineWidth: 1,
            }),
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

    it('should handle Escape key to close sub-dialogs first', async () => {
      const user = userEvent.setup();
      render(<SeriesSettingsDialog {...defaultProps} />);

      // Open line editor
      const lineRow = screen.getByText('Line').closest('[role="button"]');
      if (lineRow) {
        await user.click(lineRow);
      }

      await waitFor(() => {
        expect(screen.getByTestId('line-editor')).toBeInTheDocument();
      });

      // Press Escape - should close line editor, not main dialog
      fireEvent.keyDown(within(document.body).getByRole('dialog'), { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByTestId('line-editor')).not.toBeInTheDocument();
      });

      expect(within(document.body).getByRole('dialog')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
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
});
