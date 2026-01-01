import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input', () => {
  it('should render input element', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass(
      'flex',
      'h-10',
      'w-full',
      'rounded-md',
      'border',
      'border-gray-300'
    );
  });

  it('should merge custom className', () => {
    render(<Input data-testid="input" className="custom-input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveClass('custom-input', 'rounded-md');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('should handle type prop', () => {
    render(<Input type="password" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should handle input without explicit type', () => {
    render(<Input data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input.tagName).toBe('INPUT');
  });

  it('should handle email type', () => {
    render(<Input type="email" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should handle number type', () => {
    render(<Input type="number" data-testid="input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('should handle value and onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input data-testid="input" onChange={onChange} />);

    const input = screen.getByTestId('input');
    await user.type(input, 'hello');

    expect(onChange).toHaveBeenCalled();
    expect(input).toHaveValue('hello');
  });

  it('should handle controlled value', () => {
    const { rerender } = render(<Input data-testid="input" value="initial" onChange={() => {}} />);
    const input = screen.getByTestId('input');
    expect(input).toHaveValue('initial');

    rerender(<Input data-testid="input" value="updated" onChange={() => {}} />);
    expect(input).toHaveValue('updated');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input data-testid="input" disabled />);
    const input = screen.getByTestId('input');
    expect(input).toBeDisabled();
  });

  it('should handle required prop', () => {
    render(<Input data-testid="input" required />);
    const input = screen.getByTestId('input');
    expect(input).toBeRequired();
  });

  it('should handle placeholder prop', () => {
    render(<Input placeholder="Enter value" />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });

  it('should handle name and id props', () => {
    render(<Input data-testid="input" name="username" id="user-input" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('name', 'username');
    expect(input).toHaveAttribute('id', 'user-input');
  });

  it('should handle min and max for number type', () => {
    render(<Input data-testid="input" type="number" min={0} max={100} />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('should handle onFocus and onBlur', () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    render(<Input data-testid="input" onFocus={onFocus} onBlur={onBlur} />);

    const input = screen.getByTestId('input');
    fireEvent.focus(input);
    expect(onFocus).toHaveBeenCalledTimes(1);

    fireEvent.blur(input);
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('should handle readOnly prop', () => {
    render(<Input data-testid="input" readOnly value="read only value" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('readonly');
  });

  it('should handle autoComplete prop', () => {
    render(<Input data-testid="input" autoComplete="email" />);
    const input = screen.getByTestId('input');
    expect(input).toHaveAttribute('autocomplete', 'email');
  });
});
