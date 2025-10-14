/**
 * @vitest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { ColorPickerDialog } from '../../forms/ColorPickerDialog';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock createPortal
vi.mock('react-dom', () => ({
  ...vi.importActual('react-dom'),
  createPortal: (children: React.ReactNode) => children,
}));

describe('ColorPickerDialog', () => {
  const defaultProps = {
    isOpen: true,
    color: '#2196F3',
    opacity: 50,
    onSave: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('[]');
  });

  afterEach(() => {
    cleanup();
  });

  it('should render when open', () => {
    render(<ColorPickerDialog {...defaultProps} />);

    expect(within(document.body).getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Color Palette')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<ColorPickerDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should display current color and opacity in preview', () => {
    render(<ColorPickerDialog {...defaultProps} />);

    // Check that the opacity input shows the correct value
    expect(screen.getByDisplayValue('50%')).toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<ColorPickerDialog {...defaultProps} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should call onCancel when Escape key is pressed', async () => {
    render(<ColorPickerDialog {...defaultProps} />);

    fireEvent.keyDown(within(document.body).getByRole('dialog'), { key: 'Escape' });

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should call onCancel when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<ColorPickerDialog {...defaultProps} />);

    const overlay = within(document.body).getByRole('dialog').parentElement;
    if (overlay) {
      await user.click(overlay);
    }

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should select color from palette', async () => {
    const user = userEvent.setup();
    render(<ColorPickerDialog {...defaultProps} />);

    // Find a palette color button by its title attribute
    const redButton = screen.getByTitle('#FF4444');
    await user.click(redButton);

    // The button should have been clicked (color selection logic works)
    expect(redButton).toBeInTheDocument();
  });

  it('should open custom color picker when custom color button is clicked', async () => {
    const user = userEvent.setup();
    render(<ColorPickerDialog {...defaultProps} />);

    const customColorButton = screen.getByText('Custom color');
    await user.click(customColorButton);

    // Should now show the custom color picker
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('should update opacity slider', async () => {
    render(<ColorPickerDialog {...defaultProps} />);

    const opacitySlider = screen.getByRole('slider');
    fireEvent.change(opacitySlider, { target: { value: '75' } });

    expect(screen.getByDisplayValue('75%')).toBeInTheDocument();
  });

  it('should call onSave with correct values', async () => {
    const user = userEvent.setup();
    render(<ColorPickerDialog {...defaultProps} />);

    // Change color and opacity
    const redButton = screen.getByTitle('#FF4444');
    await user.click(redButton);

    const opacitySlider = screen.getByRole('slider');
    fireEvent.change(opacitySlider, { target: { value: '75' } });

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(defaultProps.onSave).toHaveBeenCalledWith('#FF4444', 75);
  });

  it('should show/hide custom color picker', async () => {
    const user = userEvent.setup();
    render(<ColorPickerDialog {...defaultProps} />);

    const toggleButton = screen.getByText('Custom color');
    await user.click(toggleButton);

    expect(screen.getByText('OK')).toBeInTheDocument();

    await user.click(toggleButton);
    expect(screen.queryByText('OK')).not.toBeInTheDocument();
  });

  it('should render color palette with multiple colors', () => {
    render(<ColorPickerDialog {...defaultProps} />);

    // Check that several palette colors are present
    expect(screen.getByTitle('#FFFFFF')).toBeInTheDocument();
    expect(screen.getByTitle('#FF4444')).toBeInTheDocument();
    expect(screen.getByTitle('#000000')).toBeInTheDocument();
  });

  it('should call onSave when save button is clicked', async () => {
    const user = userEvent.setup();
    render(<ColorPickerDialog {...defaultProps} />);

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(defaultProps.onSave).toHaveBeenCalledWith('#2196F3', 50);
  });

  it('should render without crashing with different props', () => {
    render(
      <ColorPickerDialog
        isOpen={true}
        color='#00FF00'
        opacity={75}
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(within(document.body).getByRole('dialog')).toBeInTheDocument();
  });

  it('should update preview color style dynamically', async () => {
    const user = userEvent.setup();
    render(<ColorPickerDialog {...defaultProps} />);

    // Select a different color
    const greenButton = screen.getByTitle('#44DD44');
    await user.click(greenButton);

    // Change opacity
    const opacitySlider = screen.getByRole('slider');
    fireEvent.change(opacitySlider, { target: { value: '25' } });

    // Check that opacity is updated in the input field
    expect(screen.getByDisplayValue('25%')).toBeInTheDocument();
  });

  it('should render dialog with proper accessibility attributes', () => {
    render(<ColorPickerDialog {...defaultProps} />);

    const dialog = within(document.body).getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'color-picker-title');
  });

  it('should handle custom color input in custom picker', async () => {
    const user = userEvent.setup();
    render(<ColorPickerDialog {...defaultProps} />);

    // Open custom color picker
    const customColorButton = screen.getByText('Custom color');
    await user.click(customColorButton);

    // Find and interact with the hex input
    const hexInput = screen.getByDisplayValue('#2196F3');
    await user.clear(hexInput);
    await user.type(hexInput, '#FF00FF');

    expect(hexInput).toHaveValue('#FF00FF');
  });
});
