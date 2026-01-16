/**
 * InlineEditField Component Tests
 *
 * Tests for the InlineEditField component with various input types
 * @version 1.0 - WP-11 Testing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import InlineEditField from '../../components/common/InlineEditField';

describe('InlineEditField Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Text Input Type', () => {
    it('renders value in view mode', () => {
      render(<InlineEditField value="Test Value" type="text" />);
      expect(screen.getByText('Test Value')).toBeInTheDocument();
    });

    it('shows placeholder when value is empty', () => {
      render(<InlineEditField value="" placeholder="Enter text..." type="text" />);
      expect(screen.getByText('Enter text...')).toBeInTheDocument();
    });

    it('enters edit mode on click', () => {
      render(<InlineEditField value="Test" type="text" />);

      fireEvent.click(screen.getByText('Test'));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('calls onSave when value changes and blurs', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<InlineEditField value="Initial" onSave={onSave} type="text" />);

      fireEvent.click(screen.getByText('Initial'));

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Updated' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('Updated');
      });
    });

    it('does not call onSave when value unchanged', async () => {
      const onSave = vi.fn();
      render(<InlineEditField value="Same" onSave={onSave} type="text" />);

      fireEvent.click(screen.getByText('Same'));

      const input = screen.getByRole('textbox');
      fireEvent.blur(input);

      expect(onSave).not.toHaveBeenCalled();
    });

    it('cancels edit on Escape key', () => {
      render(<InlineEditField value="Original" type="text" />);

      fireEvent.click(screen.getByText('Original'));

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Changed' } });
      fireEvent.keyDown(input, { key: 'Escape' });

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Original')).toBeInTheDocument();
    });

    it('saves on Enter key', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<InlineEditField value="Initial" onSave={onSave} type="text" />);

      fireEvent.click(screen.getByText('Initial'));

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Updated' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('Updated');
      });
    });
  });

  describe('Disabled State', () => {
    it('does not enter edit mode when disabled', () => {
      render(<InlineEditField value="Test" type="text" disabled />);

      fireEvent.click(screen.getByText('Test'));

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    it('applies disabled class', () => {
      const { container } = render(<InlineEditField value="Test" type="text" disabled />);
      expect(container.querySelector('.inline-edit-field')).toHaveClass('disabled');
    });
  });

  describe('Number Input Type', () => {
    it('renders number value', () => {
      render(<InlineEditField value={42} type="number" />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders number with suffix', () => {
      render(<InlineEditField value={5} type="number" suffix=" days" />);
      expect(screen.getByText('5 days')).toBeInTheDocument();
    });

    it('shows number input in edit mode', () => {
      render(<InlineEditField value={10} type="number" />);

      fireEvent.click(screen.getByText('10'));

      const input = screen.getByRole('spinbutton');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'number');
    });

    it('respects min and max constraints', () => {
      render(<InlineEditField value={5} type="number" min={0} max={10} />);

      fireEvent.click(screen.getByText('5'));

      const input = screen.getByRole('spinbutton');
      expect(input).toHaveAttribute('min', '0');
      expect(input).toHaveAttribute('max', '10');
    });

    it('shows placeholder for invalid number', () => {
      render(<InlineEditField value="not a number" type="number" placeholder="Enter number" />);
      expect(screen.getByText('Enter number')).toBeInTheDocument();
    });
  });

  describe('Date Input Type', () => {
    it('renders formatted date value', () => {
      render(<InlineEditField value="2026-01-16" type="date" />);
      // en-GB format: DD/MM/YYYY
      expect(screen.getByText('16/01/2026')).toBeInTheDocument();
    });

    it('renders long date format', () => {
      render(<InlineEditField value="2026-01-16" type="date" dateFormat="long" />);
      // en-GB long format: Thu, 16 Jan 2026
      expect(screen.getByText(/16 Jan 2026/)).toBeInTheDocument();
    });

    it('shows date input in edit mode', () => {
      render(<InlineEditField value="2026-01-16" type="date" />);

      fireEvent.click(screen.getByText('16/01/2026'));

      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });

    it('shows placeholder for invalid date', () => {
      render(<InlineEditField value="invalid" type="date" placeholder="Select date" />);
      expect(screen.getByText('Select date')).toBeInTheDocument();
    });
  });

  describe('Percentage Input Type', () => {
    it('renders percentage value', () => {
      render(<InlineEditField value={50} type="percentage" />);
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('shows percentage dropdown in edit mode', () => {
      render(<InlineEditField value={50} type="percentage" />);

      fireEvent.click(screen.getByText('50%'));

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('has standard percentage options', () => {
      render(<InlineEditField value={50} type="percentage" />);

      fireEvent.click(screen.getByText('50%'));

      const options = screen.getAllByRole('option');
      const optionLabels = options.map(o => o.textContent);

      expect(optionLabels).toContain('0%');
      expect(optionLabels).toContain('25%');
      expect(optionLabels).toContain('50%');
      expect(optionLabels).toContain('75%');
      expect(optionLabels).toContain('100%');
    });
  });

  describe('Select Input Type', () => {
    const options = [
      { value: 'opt1', label: 'Option 1' },
      { value: 'opt2', label: 'Option 2' },
      { value: 'opt3', label: 'Option 3' },
    ];

    it('renders selected option label', () => {
      render(<InlineEditField value="opt2" type="select" options={options} />);
      expect(screen.getByText('Option 2')).toBeInTheDocument();
    });

    it('shows select dropdown in edit mode', () => {
      render(<InlineEditField value="opt1" type="select" options={options} />);

      fireEvent.click(screen.getByText('Option 1'));

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('renders all options', () => {
      render(<InlineEditField value="opt1" type="select" options={options} />);

      fireEvent.click(screen.getByText('Option 1'));

      const selectOptions = screen.getAllByRole('option');
      expect(selectOptions).toHaveLength(4); // 3 options + "-- Select --"
    });

    it('auto-saves on select change', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<InlineEditField value="opt1" type="select" options={options} onSave={onSave} />);

      fireEvent.click(screen.getByText('Option 1'));

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'opt3' } });

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('opt3');
      });
    });
  });

  describe('Textarea Input Type', () => {
    it('renders textarea in edit mode', () => {
      render(<InlineEditField value="Long text" type="textarea" />);

      fireEvent.click(screen.getByText('Long text'));

      const textarea = screen.getByRole('textbox');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('does not save on Enter (allows multiline)', () => {
      const onSave = vi.fn();
      render(<InlineEditField value="Line 1" type="textarea" onSave={onSave} />);

      fireEvent.click(screen.getByText('Line 1'));

      const textarea = screen.getByRole('textbox');
      fireEvent.keyDown(textarea, { key: 'Enter' });

      expect(onSave).not.toHaveBeenCalled();
    });

    it('respects rows prop', () => {
      render(<InlineEditField value="Text" type="textarea" rows={5} />);

      fireEvent.click(screen.getByText('Text'));

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '5');
    });
  });

  describe('Manual Save Mode', () => {
    it('shows save and cancel buttons when autoSave is false', () => {
      render(<InlineEditField value="Test" type="text" autoSave={false} />);

      fireEvent.click(screen.getByText('Test'));

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(document.querySelector('.inline-edit-btn.save')).toBeInTheDocument();
      expect(document.querySelector('.inline-edit-btn.cancel')).toBeInTheDocument();
    });

    it('saves when clicking save button', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);
      render(<InlineEditField value="Initial" type="text" autoSave={false} onSave={onSave} />);

      fireEvent.click(screen.getByText('Initial'));

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Updated' } });

      const saveBtn = document.querySelector('.inline-edit-btn.save');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith('Updated');
      });
    });

    it('cancels when clicking cancel button', () => {
      render(<InlineEditField value="Original" type="text" autoSave={false} />);

      fireEvent.click(screen.getByText('Original'));

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Changed' } });

      const cancelBtn = document.querySelector('.inline-edit-btn.cancel');
      fireEvent.click(cancelBtn);

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Original')).toBeInTheDocument();
    });
  });

  describe('Label and Edit Icon', () => {
    it('renders label when provided', () => {
      render(<InlineEditField value="Value" type="text" label="Field Label" />);
      expect(screen.getByText('Field Label')).toBeInTheDocument();
    });

    it('shows edit icon when showEditIcon is true', () => {
      const { container } = render(
        <InlineEditField value="Value" type="text" showEditIcon />
      );
      expect(container.querySelector('.inline-edit-icon')).toBeInTheDocument();
    });

    it('does not show edit icon when disabled', () => {
      const { container } = render(
        <InlineEditField value="Value" type="text" showEditIcon disabled />
      );
      expect(container.querySelector('.inline-edit-icon')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('reverts value on save error', async () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));

      render(<InlineEditField value="Original" type="text" onSave={onSave} />);

      fireEvent.click(screen.getByText('Original'));

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Changed' } });
      fireEvent.blur(input);

      await waitFor(() => {
        expect(screen.getByText('Original')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('CSS Classes', () => {
    it('applies custom className', () => {
      const { container } = render(
        <InlineEditField value="Value" type="text" className="custom-class" />
      );
      expect(container.querySelector('.inline-edit-field')).toHaveClass('custom-class');
    });

    it('applies empty class when value is empty', () => {
      const { container } = render(
        <InlineEditField value="" type="text" />
      );
      expect(container.querySelector('.inline-edit-field')).toHaveClass('empty');
    });

    it('applies editing class when in edit mode', () => {
      const { container } = render(
        <InlineEditField value="Value" type="text" />
      );

      fireEvent.click(screen.getByText('Value'));

      expect(container.querySelector('.inline-edit-field')).toHaveClass('editing');
    });
  });
});
