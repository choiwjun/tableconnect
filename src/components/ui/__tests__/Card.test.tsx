import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should apply default variant styles', () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId('card').className).toContain('glass');
  });

  it('should apply glow variant styles', () => {
    render(<Card variant="glow" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card').className).toContain('glass-hover');
  });

  it('should be clickable when onClick is provided', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable card</Card>);

    fireEvent.click(screen.getByText('Clickable card'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should have button role when clickable', () => {
    render(<Card onClick={() => {}}>Clickable card</Card>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should not have button role when not clickable', () => {
    render(<Card>Static card</Card>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should be keyboard accessible when clickable', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable card</Card>);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should activate on space key when clickable', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable card</Card>);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply cursor-pointer when clickable', () => {
    render(<Card onClick={() => {}} data-testid="card">Clickable card</Card>);
    expect(screen.getByTestId('card').className).toContain('cursor-pointer');
  });

  it('should apply hover scale when clickable', () => {
    render(<Card onClick={() => {}} data-testid="card">Clickable card</Card>);
    expect(screen.getByTestId('card').className).toContain('hover:scale-[1.02]');
  });

  it('should forward custom className', () => {
    render(<Card className="custom-card" data-testid="card">Content</Card>);
    expect(screen.getByTestId('card').className).toContain('custom-card');
  });
});
