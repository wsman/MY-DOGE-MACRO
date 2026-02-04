import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataCard } from './DataCard';

describe('DataCard Molecule', () => {
  it('renders with title and value', () => {
    render(<DataCard title="Revenue" value="$10,000" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$10,000')).toBeInTheDocument();
  });

  it('shows up trend', () => {
    render(<DataCard title="Growth" value="25%" trend="up" trendValue="+5%" />);
    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByText('↑')).toBeInTheDocument();
  });

  it('shows down trend', () => {
    render(<DataCard title="Loss" value="$500" trend="down" trendValue="-2%" />);
    expect(screen.getByText('-2%')).toBeInTheDocument();
    expect(screen.getByText('↓')).toBeInTheDocument();
  });

  it('shows neutral trend', () => {
    render(<DataCard title="Stable" value="$100" trend="neutral" trendValue="0%" />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('renders without trend', () => {
    render(<DataCard title="Total" value="100" />);
    expect(screen.queryByText('↑')).not.toBeInTheDocument();
    expect(screen.queryByText('↓')).not.toBeInTheDocument();
  });
});
