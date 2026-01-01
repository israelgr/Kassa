import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

interface WrapperProps {
  children: ReactNode;
}

interface CustomRenderOptions extends RenderOptions {
  initialEntries?: string[];
}

function AllProviders({ children }: WrapperProps) {
  return (
    <MemoryRouter>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const { initialEntries, ...renderOptions } = options || {};

  const Wrapper = ({ children }: WrapperProps) => (
    <MemoryRouter initialEntries={initialEntries || ['/']}>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

export * from '@testing-library/react';
export { customRender as render };
