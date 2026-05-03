import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import { type ReactNode } from 'react';
import { ToastProvider } from '../components/Toast';

const mockUser = { user_id: 'test-uid', email: 'test@test.com', display_name: 'Тест' };

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    token: 'test-token',
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    updateDisplayName: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

function AllProviders({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}

export function renderWithProviders(ui: ReactNode, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export { mockUser };
