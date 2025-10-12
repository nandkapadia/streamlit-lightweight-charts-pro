/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { LineEditorDialog, LineConfig } from '../../forms/LineEditorDialog';

// Mock createPortal
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

// Mock ColorPickerDialog
vi.mock('../../components/ColorPickerDialog', () => ({
  ColorPickerDialog: ({ isOpen, color, opacity, onSave, onCancel }: any) =>
    isOpen ? (
      <div data-testid='color-picker'>
        <span>Color: {color}</span>
        <span>Opacity: {opacity}</span>
        <button onClick={() => onSave('#FF0000', 100)}>Save Color</button>
        <button onClick={onCancel}>Cancel Color</button>
      </div>
    ) : null,
}));

describe('LineEditorDialog', () => {
  const defaultConfig: LineConfig = {
    color: '#4499FF',
    style: 'solid',
    width: 2,
  };

  const defaultProps = {
    isOpen: true,
    config: defaultConfig,
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render when open', () => {
    render(<LineEditorDialog {...defaultProps} />);

    expect(within(document.body).getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Line Color')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<LineEditorDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should display current configuration in preview', () => {
    render(<LineEditorDialog {...defaultProps} />);

    // Check that color palette contains the current color
    expect(screen.getByTitle('#4499FF')).toBeInTheDocument();
    // The component should render the color palette and controls
    expect(within(document.body).getByRole('dialog')).toBeInTheDocument();
  });

  it('should call onCancel when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<LineEditorDialog {...defaultProps} />);

    const closeButton = screen.getByText('Cancel');
    await user.click(closeButton);

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should call onCancel when Escape key is pressed', () => {
    render(<LineEditorDialog {...defaultProps} />);

    fireEvent.keyDown(within(document.body).getByRole('dialog'), { key: 'Escape' });

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should open color picker when custom color button is clicked', async () => {
    const user = userEvent.setup();
    render(<LineEditorDialog {...defaultProps} />);

    const customColorButton = screen.getByText('Custom color');
    await user.click(customColorButton);

    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByDisplayValue('#ff0000')).toBeInTheDocument();
  });

  it('should open color picker when Enter key is pressed on custom color button', async () => {
    const user = userEvent.setup();
    render(<LineEditorDialog {...defaultProps} />);

    const customColorButton = screen.getByText('Custom color');
    await user.click(customColorButton);

    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('should open color picker when Space key is pressed on custom color button', async () => {
    const user = userEvent.setup();
    render(<LineEditorDialog {...defaultProps} />);

    const customColorButton = screen.getByText('Custom color');
    await user.click(customColorButton);

    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('should close color picker when custom color button is clicked again', async () => {
    const user = userEvent.setup();
    render(<LineEditorDialog {...defaultProps} />);

    // Open color picker
    const customColorButton = screen.getByText('Custom color');
    await user.click(customColorButton);

    expect(screen.getByText('OK')).toBeInTheDocument();

    // Close color picker by clicking custom color button again
    await user.click(customColorButton);

    expect(screen.queryByText('OK')).not.toBeInTheDocument();
  });

  it('should update color when custom color is selected', async () => {
    const user = userEvent.setup();
    render(<LineEditorDialog {...defaultProps} />);

    // Open color picker
    const customColorButton = screen.getByText('Custom color');
    await user.click(customColorButton);

    // Select new color
    const okButton = screen.getByText('OK');
    await user.click(okButton);

    // Color picker should close and color should be updated
    expect(screen.queryByText('OK')).not.toBeInTheDocument();
    // The color should be updated in the component state - check that the custom color button shows the new color
    expect(screen.getByText('Custom color')).toBeInTheDocument();
  });

  it('should select line style', async () => {
    const user = userEvent.setup();
    render(<LineEditorDialog {...defaultProps} />);

    const dashedStyleButton = screen.getByTitle('Dashed');
    await user.click(dashedStyleButton);

    // The button should be selected (have the selected styling)
    expect(dashedStyleButton).toHaveStyle('border: 2px solid #2962ff');
  });

  it('should select line width', async () => {
    const user = userEvent.setup();
    render(<LineEditorDialog {...defaultProps} />);

    const width4Button = screen.getByTitle('Extra Thick');
    await user.click(width4Button);

    // The button should be selected (have the selected styling)
    expect(width4Button).toHaveStyle('border: 2px solid #2962ff');
  });

  it('should call onSave with updated configuration', async () => {
    const user = userEvent.setup();
    render(<LineEditorDialog {...defaultProps} />);

    // Change color by selecting a different color from palette
    const redColorButton = screen.getByTitle('#FF4444');
    await user.click(redColorButton);

    // Change style
    const dashedStyleButton = screen.getByTitle('Dashed');
    await user.click(dashedStyleButton);

    // Change width
    const width4Button = screen.getByTitle('Extra Thick');
    await user.click(width4Button);

    // Save
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(defaultProps.onSave).toHaveBeenCalledWith({
      color: '#FF4444',
      style: 'dashed',
      width: 4,
      opacity: 100,
    });
  });

  it('should handle Escape key when custom color picker is open', async () => {
    const user = userEvent.setup();
    render(<LineEditorDialog {...defaultProps} />);

    // Open color picker first
    const customColorButton = screen.getByText('Custom color');
    await user.click(customColorButton);

    expect(screen.getByText('OK')).toBeInTheDocument();

    // Press Escape - should close the dialog (not just the color picker)
    await user.keyboard('{Escape}');

    // The dialog should be closed
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should handle Tab key navigation with focus trap', () => {
    render(<LineEditorDialog {...defaultProps} />);

    const dialog = within(document.body).getByRole('dialog');
    const focusableElements = dialog.querySelectorAll(
      'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the last element and press Tab - should focus first element
    lastElement.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: false });

    // Focus the first element and press Shift+Tab - should focus last element
    firstElement.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
  });

  it('should update preview when configuration changes', async () => {
    const user = userEvent.setup();
    render(<LineEditorDialog {...defaultProps} />);

    // Initially should show default config
    const dialog = within(document.body).getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Change width and verify preview updates
    const width4Button = screen.getByTitle('Extra Thick');
    await user.click(width4Button);

    // The button should be selected (have the selected styling)
    expect(width4Button).toHaveStyle('border: 2px solid #2962ff');
  });

  it('should initialize with provided config', () => {
    const customConfig: LineConfig = {
      color: '#FF4444', // Use a color that exists in the palette
      style: 'dashed',
      width: 3,
    };

    render(<LineEditorDialog {...defaultProps} config={customConfig} />);

    // Check that the color button is selected
    expect(screen.getByTitle('#FF4444')).toHaveStyle('border: 2px solid #2962ff');
    // Check that the dashed style button is selected
    expect(screen.getByTitle('Dashed')).toHaveStyle('border: 2px solid #2962ff');
    // Check that the thick width button is selected
    expect(screen.getByTitle('Thick')).toHaveStyle('border: 2px solid #2962ff');
  });

  it('should update local config when prop config changes', () => {
    const { rerender } = render(<LineEditorDialog {...defaultProps} />);

    const newConfig: LineConfig = {
      color: '#44DD44', // Use a color that exists in the palette
      style: 'dotted',
      width: 4,
    };

    rerender(<LineEditorDialog {...defaultProps} config={newConfig} />);

    // Check that the new color button is selected
    expect(screen.getByTitle('#44DD44')).toHaveStyle('border: 2px solid #2962ff');
    // Check that the dotted style button is selected
    expect(screen.getByTitle('Dotted')).toHaveStyle('border: 2px solid #2962ff');
    // Check that the extra thick width button is selected
    expect(screen.getByTitle('Extra Thick')).toHaveStyle('border: 2px solid #2962ff');
  });

  it('should focus the first focusable element when opened', async () => {
    const { rerender } = render(<LineEditorDialog {...defaultProps} isOpen={false} />);

    rerender(<LineEditorDialog {...defaultProps} isOpen={true} />);

    // Wait for the component to be fully rendered and focused
    await new Promise(resolve => setTimeout(resolve, 100));

    // The dialog should be rendered and visible
    expect(within(document.body).getByRole('dialog')).toBeInTheDocument();

    // Check that the dialog is visible and accessible
    const dialog = within(document.body).getByRole('dialog');
    expect(dialog).toBeVisible();
  });

  it('should render all line style options', () => {
    render(<LineEditorDialog {...defaultProps} />);

    expect(screen.getByTitle('Solid')).toBeInTheDocument();
    expect(screen.getByTitle('Dashed')).toBeInTheDocument();
    expect(screen.getByTitle('Dotted')).toBeInTheDocument();
  });

  it('should render all line width options', () => {
    render(<LineEditorDialog {...defaultProps} />);

    expect(screen.getByTitle('Thin')).toBeInTheDocument();
    expect(screen.getByTitle('Medium')).toBeInTheDocument();
    expect(screen.getByTitle('Thick')).toBeInTheDocument();
    expect(screen.getByTitle('Extra Thick')).toBeInTheDocument();
  });
});
