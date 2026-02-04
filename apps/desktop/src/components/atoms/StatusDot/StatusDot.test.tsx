import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusDot } from './StatusDot';

describe('StatusDot Component', () => {
  it('renders with connected status', () => {
    render(<StatusDot status="connected" />);
    const dot = screen.getByRole('status');
    expect(dot).toHaveClass('status-dot');
    expect(dot).toHaveClass('status-dot--connected');
  });

  it('renders with disconnected status', () => {
    render(<StatusDot status="disconnected" />);
    const dot = screen.getByRole('status');
    expect(dot).toHaveClass('status-dot--disconnected');
  });

  it('renders with loading status', () => {
    render(<StatusDot status="loading" />);
    const dot = screen.getByRole('status');
    expect(dot).toHaveClass('status-dot--loading');
  });

  it('renders different sizes', () => {
    render(
      <>
        <StatusDot status="connected" size="sm" />
        <StatusDot status="connected" size="md" />
      </>
    );
    const dots = screen.getAllByRole('status');
    expect(dots[0]).toHaveClass('status-dot--sm');
    expect(dots[1]).toHaveClass('status-dot--md');
  });

  it('shows pulse animation when enabled', () => {
    render(<StatusDot status="connected" pulse={true} />);
    const dot = screen.getByRole('status');
    expect(dot).toHaveClass('status-dot--pulse');
  });

  it('does not show pulse when disabled', () => {
    render(<StatusDot status="connected" pulse={false} />);
    const dot = screen.getByRole('status');
    expect(dot).not.toHaveClass('status-dot--pulse');
  });
});
