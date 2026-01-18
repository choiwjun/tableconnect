import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should be disabled when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show loading spinner when loading', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should apply primary variant styles by default', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('from-neon-pink');
    expect(button.className).toContain('to-neon-purple');
  });

  it('should apply secondary variant styles', () => {
    render(<Button variant="secondary">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-steel');
  });

  it('should apply ghost variant styles', () => {
    render(<Button variant="ghost">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-transparent');
  });

  it('should apply danger variant styles', () => {
    render(<Button variant="danger">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-red-600');
  });

  it('should apply size styles', () => {
    const { rerender } = render(<Button size="sm">Click me</Button>);
    expect(screen.getByRole('button').className).toContain('px-3');

    rerender(<Button size="md">Click me</Button>);
    expect(screen.getByRole('button').className).toContain('px-4');

    rerender(<Button size="lg">Click me</Button>);
    expect(screen.getByRole('button').className).toContain('px-6');
  });

  it('should apply fullWidth styles', () => {
    render(<Button fullWidth>Click me</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  it('should forward custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    expect(screen.getByRole('button').className).toContain('custom-class');
  });

  it('should forward button type', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });
});
