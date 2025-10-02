/**
 * Tests for React 19 Form Actions component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartConfigForm } from '../../forms/ChartFormActions';

// Mock useChartFormActions hook
vi.mock('../../hooks/useChartFormActions', () => ({
  useChartFormActions: vi.fn(),
}));

describe('ChartConfigForm', () => {
  let mockFormActions: any;

  beforeEach(async () => {
    mockFormActions = {
      config: {
        state: {
          data: null,
          error: null,
          lastAction: null,
        },
        isSubmitting: false,
        submitAction: vi.fn(),
        resetForm: vi.fn(),
        hasError: false,
        getFieldError: vi.fn(() => null),
        hasFieldError: vi.fn(() => false),
      },
      import: {
        state: { data: null, error: null },
        isSubmitting: false,
        submitAction: vi.fn(),
      },
      export: {
        state: { data: null, error: null },
        isSubmitting: false,
        submitAction: vi.fn(),
      },
    };

    const mockModule = await vi.importMock('../../hooks/useChartFormActions');
    (mockModule.useChartFormActions as any).mockReturnValue(mockFormActions);
  });

  it('should render form with chart configuration fields', () => {
    render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/chart title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update configuration/i })).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    const user = userEvent.setup();
    const onConfigUpdate = vi.fn();

    render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={onConfigUpdate}
      />
    );

    const titleInput = screen.getByLabelText(/chart title/i);
    const widthInput = screen.getByLabelText(/width/i);
    const submitButton = screen.getByRole('button', { name: /update configuration/i });

    await user.clear(titleInput);
    await user.type(titleInput, 'Test Chart');
    await user.clear(widthInput);
    await user.type(widthInput, '600');
    await user.click(submitButton);

    expect(mockFormActions.config.submitAction).toHaveBeenCalled();
  });

  it('should show loading state during submission', () => {
    mockFormActions.config.isSubmitting = true;

    render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={vi.fn()}
      />
    );

    const submitButton = screen.getByRole('button', { name: /updating.../i });
    expect(submitButton).toBeDisabled();
  });

  it('should display form errors', () => {
    mockFormActions.config.state.error = 'Invalid configuration';
    mockFormActions.config.hasError = true;

    render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('Invalid configuration')).toBeInTheDocument();
  });

  it('should display success message', () => {
    mockFormActions.config.state.lastAction = 'config_updated';
    mockFormActions.config.state.data = { title: 'Updated Chart' };

    const onConfigUpdate = vi.fn();

    render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={onConfigUpdate}
      />
    );

    expect(screen.getByText(/configuration updated successfully/i)).toBeInTheDocument();
    expect(onConfigUpdate).toHaveBeenCalledWith({ title: 'Updated Chart' });
  });

  it('should handle field validation errors', () => {
    mockFormActions.config.getFieldError.mockImplementation((field: string) => {
      if (field === 'title') return 'Title is required';
      return null;
    });

    render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={vi.fn()}
      />
    );

    expect(screen.getByText('Title is required')).toBeInTheDocument();
  });

  it('should support progressive enhancement', () => {
    const { container } = render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={vi.fn()}
      />
    );

    const form = container.querySelector('form');
    expect(form).toHaveAttribute('action');
  });

  it('should show reset button', () => {
    render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={vi.fn()}
      />
    );

    const resetButton = screen.getByRole('button', { name: /reset/i });
    expect(resetButton).toBeInTheDocument();
  });

  it('should validate number input fields', () => {
    render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={vi.fn()}
      />
    );

    const widthInput = screen.getByLabelText(/width/i);
    expect(widthInput).toHaveAttribute('type', 'number');
    expect(widthInput).toHaveAttribute('min', '100');
  });

  it('should support initial configuration', () => {
    const initialConfig = {
      title: 'Initial Chart',
      width: 900,
      height: 500
    };

    render(
      <ChartConfigForm
        chartId="test-chart"
        initialConfig={initialConfig}
        onConfigUpdate={vi.fn()}
      />
    );

    const titleInput = screen.getByDisplayValue('Initial Chart');
    const widthInput = screen.getByDisplayValue('900');
    expect(titleInput).toBeInTheDocument();
    expect(widthInput).toBeInTheDocument();
  });

  it('should support price scale position selection', async () => {
    const user = userEvent.setup();

    render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={vi.fn()}
      />
    );

    const positionSelect = screen.getByLabelText(/position/i);

    await user.selectOptions(positionSelect, 'left');
    expect(positionSelect).toHaveValue('left');

    await user.selectOptions(positionSelect, 'right');
    expect(positionSelect).toHaveValue('right');
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/chart title/i);

    await user.click(titleInput);
    await user.keyboard('{Tab}');

    const widthInput = screen.getByLabelText(/width/i);
    expect(widthInput).toHaveFocus();
  });

  it('should disable inputs when submitting', () => {
    mockFormActions.config.isSubmitting = true;

    render(
      <ChartConfigForm
        chartId="test-chart"
        onConfigUpdate={vi.fn()}
      />
    );

    const titleInput = screen.getByLabelText(/chart title/i);
    const widthInput = screen.getByLabelText(/width/i);
    const submitButton = screen.getByRole('button', { name: /updating.../i });

    expect(titleInput).toBeDisabled();
    expect(widthInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});
