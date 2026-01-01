import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'shadow-sm');
  });

  it('should merge custom className', () => {
    render(<Card data-testid="card" className="custom-class">Content</Card>);
    const card = screen.getByTestId('card');
    expect(card).toHaveClass('custom-class', 'rounded-lg');
  });

  it('should forward ref', () => {
    const ref = { current: null };
    render(<Card ref={ref}>Content</Card>);
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardHeader', () => {
  it('should render children', () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    render(<CardHeader data-testid="header">Content</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
  });

  it('should merge custom className', () => {
    render(<CardHeader data-testid="header" className="custom">Content</CardHeader>);
    const header = screen.getByTestId('header');
    expect(header).toHaveClass('custom', 'p-6');
  });
});

describe('CardTitle', () => {
  it('should render as h3 element', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toHaveTextContent('Title');
  });

  it('should apply default classes', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByRole('heading');
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
  });

  it('should merge custom className', () => {
    render(<CardTitle className="custom-title">Title</CardTitle>);
    const title = screen.getByRole('heading');
    expect(title).toHaveClass('custom-title', 'text-2xl');
  });
});

describe('CardDescription', () => {
  it('should render children', () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText('Description text')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    render(<CardDescription data-testid="desc">Desc</CardDescription>);
    const desc = screen.getByTestId('desc');
    expect(desc).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('should merge custom className', () => {
    render(<CardDescription data-testid="desc" className="custom">Desc</CardDescription>);
    const desc = screen.getByTestId('desc');
    expect(desc).toHaveClass('custom', 'text-sm');
  });
});

describe('CardContent', () => {
  it('should render children', () => {
    render(<CardContent>Content here</CardContent>);
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    render(<CardContent data-testid="content">Content</CardContent>);
    const content = screen.getByTestId('content');
    expect(content).toHaveClass('p-6', 'pt-0');
  });

  it('should merge custom className', () => {
    render(<CardContent data-testid="content" className="custom">Content</CardContent>);
    const content = screen.getByTestId('content');
    expect(content).toHaveClass('custom', 'p-6');
  });
});

describe('CardFooter', () => {
  it('should render children', () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  it('should merge custom className', () => {
    render(<CardFooter data-testid="footer" className="custom">Footer</CardFooter>);
    const footer = screen.getByTestId('footer');
    expect(footer).toHaveClass('custom', 'flex');
  });
});

describe('Card composition', () => {
  it('should render complete card with all sub-components', () => {
    render(
      <Card data-testid="card">
        <CardHeader data-testid="header">
          <CardTitle>My Title</CardTitle>
          <CardDescription>My description</CardDescription>
        </CardHeader>
        <CardContent data-testid="content">
          <p>Main content</p>
        </CardContent>
        <CardFooter data-testid="footer">
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('My Title');
    expect(screen.getByText('My description')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByText('Main content')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Action');
  });
});
