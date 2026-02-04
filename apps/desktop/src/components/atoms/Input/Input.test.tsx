import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from './Input';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('renders with value', () => {
    render(<Input value="Test value" onChange={() => {}} />);
    const input = screen.getByDisplayValue('Test value');
    expect(input).toBeInTheDocument();
  });

  it('handles change events', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'New value' } });
    expect(handleChange).toHaveBeenCalledWith('New value');
  });

  it('shows error state', () => {
    render(<Input error="Invalid input" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input--error');
  });

  it('is disabled when disabled prop is set', () => {
    render(<Input disabled onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" onChange={() => {}} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });
});
