import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusIndicator } from './StatusIndicator';

describe('StatusIndicator Molecule', () => {
  it('renders online status', () => {
    render(<StatusIndicator status="online" label="System Online" />);
    expect(screen.getByText('System Online')).toBeInTheDocument();
  });

  it('renders offline status', () => {
    render(<StatusIndicator status="offline" label="System Offline" />);
    expect(screen.getByText('System Offline')).toBeInTheDocument();
  });

  it('renders error status', () => {
    render(<StatusIndicator status="error" label="Error State" />);
    expect(screen.getByText('Error State')).toBeInTheDocument();
  });

  it('shows status icon', () => {
    render(<StatusIndicator status="online" label="Online" />);
    const icon = screen.getByRole('status');
    expect(icon).toBeInTheDocument();
  });
});
