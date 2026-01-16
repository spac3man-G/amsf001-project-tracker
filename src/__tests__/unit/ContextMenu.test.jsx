/**
 * ContextMenu Component Tests
 *
 * Tests for the ContextMenu component and useContextMenu hook
 * @version 1.0 - WP-11 Testing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import ContextMenu, { useContextMenu } from '../../components/common/ContextMenu';

// Mock icon component
const MockIcon = ({ size, className }) => (
  <svg data-testid="mock-icon" width={size} height={size} className={className} />
);

describe('ContextMenu Component', () => {
  const defaultProps = {
    isOpen: true,
    x: 100,
    y: 200,
    items: [
      { label: 'Open', icon: MockIcon, onClick: vi.fn() },
      { label: 'Edit', icon: MockIcon, onClick: vi.fn() },
      { divider: true },
      { label: 'Delete', icon: MockIcon, onClick: vi.fn(), danger: true },
    ],
    onClose: vi.fn(),
    contextData: { id: '123', name: 'Test Item' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(<ContextMenu {...defaultProps} />);

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ContextMenu {...defaultProps} isOpen={false} />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('renders menu items with icons', () => {
    render(<ContextMenu {...defaultProps} />);

    const icons = screen.getAllByTestId('mock-icon');
    expect(icons).toHaveLength(3); // 3 items with icons (divider has no icon)
  });

  it('renders divider between items', () => {
    render(<ContextMenu {...defaultProps} />);

    const dividers = screen.getAllByRole('separator');
    expect(dividers).toHaveLength(1);
  });

  it('applies danger class to danger items', () => {
    render(<ContextMenu {...defaultProps} />);

    const deleteButton = screen.getByText('Delete').closest('button');
    expect(deleteButton).toHaveClass('danger');
  });

  it('calls onClick with contextData when item is clicked', () => {
    render(<ContextMenu {...defaultProps} />);

    const openButton = screen.getByText('Open').closest('button');
    fireEvent.click(openButton);

    expect(defaultProps.items[0].onClick).toHaveBeenCalledWith(defaultProps.contextData);
  });

  it('calls onClose after item click', () => {
    render(<ContextMenu {...defaultProps} />);

    const openButton = screen.getByText('Open').closest('button');
    fireEvent.click(openButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('renders disabled items with disabled class', () => {
    const items = [
      { label: 'Disabled Action', icon: MockIcon, onClick: vi.fn(), disabled: true }
    ];

    render(<ContextMenu {...defaultProps} items={items} />);

    const button = screen.getByText('Disabled Action').closest('button');
    expect(button).toHaveClass('disabled');
    expect(button).toBeDisabled();
  });

  it('does not call onClick for disabled items', async () => {
    const onClick = vi.fn();
    const items = [
      { label: 'Disabled Action', icon: MockIcon, onClick, disabled: true }
    ];

    render(<ContextMenu {...defaultProps} items={items} />);

    const button = screen.getByText('Disabled Action').closest('button');
    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders shortcut text when provided', () => {
    const items = [
      { label: 'Copy', icon: MockIcon, onClick: vi.fn(), shortcut: 'Ctrl+C' }
    ];

    render(<ContextMenu {...defaultProps} items={items} />);

    expect(screen.getByText('Ctrl+C')).toBeInTheDocument();
  });

  it('positions menu at specified coordinates', () => {
    render(<ContextMenu {...defaultProps} />);

    const menu = screen.getByRole('menu');
    expect(menu).toHaveStyle({ left: '100px', top: '200px' });
  });

  it('has correct ARIA attributes', () => {
    render(<ContextMenu {...defaultProps} />);

    const menu = screen.getByRole('menu');
    expect(menu).toHaveAttribute('aria-label', 'Context menu');

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems).toHaveLength(3); // 3 items (divider is not a menuitem)
  });

  it('closes on Escape key', async () => {
    vi.useFakeTimers();
    render(<ContextMenu {...defaultProps} />);

    // Wait for the event listeners to be attached (10ms delay in component)
    await act(async () => {
      vi.advanceTimersByTime(20);
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(defaultProps.onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe('useContextMenu Hook', () => {
  it('initializes with closed state', () => {
    const { result } = renderHook(() => useContextMenu());

    expect(result.current.contextMenu.isOpen).toBe(false);
    expect(result.current.contextMenu.x).toBe(0);
    expect(result.current.contextMenu.y).toBe(0);
    expect(result.current.contextMenu.data).toBeNull();
  });

  it('opens context menu with correct position and data', () => {
    const { result } = renderHook(() => useContextMenu());

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 150,
      clientY: 250
    };
    const testData = { id: 'test-id' };

    act(() => {
      result.current.openContextMenu(mockEvent, testData);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(result.current.contextMenu.isOpen).toBe(true);
    expect(result.current.contextMenu.x).toBe(150);
    expect(result.current.contextMenu.y).toBe(250);
    expect(result.current.contextMenu.data).toEqual(testData);
  });

  it('closes context menu while preserving other state', () => {
    const { result } = renderHook(() => useContextMenu());

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      clientX: 150,
      clientY: 250
    };

    act(() => {
      result.current.openContextMenu(mockEvent, { id: 'test' });
    });

    act(() => {
      result.current.closeContextMenu();
    });

    expect(result.current.contextMenu.isOpen).toBe(false);
    // Position and data should be preserved (for animations/transitions if needed)
    expect(result.current.contextMenu.x).toBe(150);
    expect(result.current.contextMenu.y).toBe(250);
  });

  it('returns stable function references', () => {
    const { result, rerender } = renderHook(() => useContextMenu());

    const { openContextMenu: open1, closeContextMenu: close1 } = result.current;

    rerender();

    const { openContextMenu: open2, closeContextMenu: close2 } = result.current;

    expect(open1).toBe(open2);
    expect(close1).toBe(close2);
  });
});
