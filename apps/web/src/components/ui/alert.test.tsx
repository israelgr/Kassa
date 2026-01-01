import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from './alert';

describe('Alert', () => {
  it('should render with role="alert"', () => {
    render(<Alert>Alert content</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should render children', () => {
    render(<Alert>Alert message</Alert>);
    expect(screen.getByText('Alert message')).toBeInTheDocument();
  });

  it('should apply default variant classes', () => {
    render(<Alert data-testid="alert">Default</Alert>);
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveClass('bg-background', 'text-foreground');
  });

  it('should apply destructive variant classes', () => {
    render(<Alert variant="destructive" data-testid="alert">Error</Alert>);
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveClass('border-red-200', 'bg-red-50', 'text-red-800');
  });

  it('should apply success variant classes', () => {
    render(<Alert variant="success" data-testid="alert">Success</Alert>);
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveClass('border-green-200', 'bg-green-50', 'text-green-800');
  });

  it('should apply warning variant classes', () => {
    render(<Alert variant="warning" data-testid="alert">Warning</Alert>);
    const alert = screen.getByTestId('alert');
    expect(alert).toHaveClass('border-yellow-200', 'bg-yellow-50', 'text-yellow-800');
  });

  it('should merge custom className', () => {
    render(<Alert className="custom-alert">Content</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-alert');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Alert ref={ref}>Content</Alert>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should apply base classes', () => {
    render(<Alert>Content</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg', 'border', 'p-4');
  });
});

describe('AlertTitle', () => {
  it('should render as h5 element', () => {
    render(<AlertTitle>Title</AlertTitle>);
    const title = screen.getByRole('heading', { level: 5 });
    expect(title).toHaveTextContent('Title');
  });

  it('should apply default classes', () => {
    render(<AlertTitle>Title</AlertTitle>);
    const title = screen.getByRole('heading');
    expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight');
  });

  it('should merge custom className', () => {
    render(<AlertTitle className="custom-title">Title</AlertTitle>);
    const title = screen.getByRole('heading');
    expect(title).toHaveClass('custom-title', 'font-medium');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<AlertTitle ref={ref}>Title</AlertTitle>);
    expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
  });
});

describe('AlertDescription', () => {
  it('should render children', () => {
    render(<AlertDescription>Description text</AlertDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    render(<AlertDescription data-testid="desc">Description</AlertDescription>);
    const desc = screen.getByTestId('desc');
    expect(desc).toHaveClass('text-sm');
  });

  it('should merge custom className', () => {
    render(<AlertDescription data-testid="desc" className="custom">Description</AlertDescription>);
    const desc = screen.getByTestId('desc');
    expect(desc).toHaveClass('custom', 'text-sm');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<AlertDescription ref={ref}>Description</AlertDescription>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Alert composition', () => {
  it('should render complete alert with title and description', () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong</AlertDescription>
      </Alert>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('Error');
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render success alert composition', () => {
    render(
      <Alert variant="success">
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>Your action was completed successfully.</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-green-50');
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Your action was completed successfully.')).toBeInTheDocument();
  });

  it('should render warning alert composition', () => {
    render(
      <Alert variant="warning">
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Please review before continuing.</AlertDescription>
      </Alert>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-yellow-50');
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Please review before continuing.')).toBeInTheDocument();
  });
});
