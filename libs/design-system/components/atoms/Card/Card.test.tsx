import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardTitle, CardContent } from './Card';

describe('Card Component', () => {
  it('renders with default props', () => {
    render(<Card>Content</Card>);
    const card = screen.getByText('Content');
    expect(card).toHaveClass('card');
  });

  it('renders with elevation levels', () => {
    render(
      <>
        <Card elevation="none">None</Card>
        <Card elevation="low">Low</Card>
        <Card elevation="medium">Medium</Card>
        <Card elevation="high">High</Card>
      </>
    );
    expect(screen.getByText('None')).toHaveClass('card--elevation-none');
    expect(screen.getByText('Low')).toHaveClass('card--elevation-low');
    expect(screen.getByText('Medium')).toHaveClass('card--elevation-medium');
    expect(screen.getByText('High')).toHaveClass('card--elevation-high');
  });

  it('renders with padding sizes', () => {
    render(
      <>
        <Card padding="none">None</Card>
        <Card padding="sm">Small</Card>
        <Card padding="md">Medium</Card>
        <Card padding="lg">Large</Card>
      </>
    );
    expect(screen.getByText('None')).toHaveClass('card--padding-none');
    expect(screen.getByText('Small')).toHaveClass('card--padding-sm');
    expect(screen.getByText('Medium')).toHaveClass('card--padding-md');
    expect(screen.getByText('Large')).toHaveClass('card--padding-lg');
  });

  it('renders CardTitle', () => {
    render(
      <Card>
        <CardTitle>Title</CardTitle>
      </Card>
    );
    const title = screen.getByText('Title');
    expect(title).toHaveClass('card--title');
  });

  it('renders CardContent', () => {
    render(
      <Card>
        <CardContent>Content</CardContent>
      </Card>
    );
    const content = screen.getByText('Content');
    expect(content).toHaveClass('card--content');
  });

  it('renders children correctly', () => {
    render(
      <Card>
        <span data-testid="child">Child Element</span>
      </Card>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<Card className="custom-card">Content</Card>);
    const card = screen.getByText('Content');
    expect(card).toHaveClass('custom-card');
  });
});
