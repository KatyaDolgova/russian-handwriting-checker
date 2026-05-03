import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/helpers';
import FunctionsPage from '../../pages/FunctionsPage';

vi.mock('../../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { user_id: 'test-uid', email: 'test@test.com' },
    token: 'test-token',
  }),
}));

describe('FunctionsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders both tabs', () => {
    renderWithProviders(<FunctionsPage />);
    // "Мои функции" есть и в кнопке-табе и в заголовке FunctionManager — ищем по роли
    expect(screen.getByRole('button', { name: /Мои функции/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Галерея/ })).toBeInTheDocument();
  });

  it('shows "Мои функции" tab by default', () => {
    renderWithProviders(<FunctionsPage />);
    const mineTab = screen.getByRole('button', { name: /Мои функции/ });
    expect(mineTab).toHaveClass('bg-white');
  });

  it('switches to gallery tab on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FunctionsPage />);

    await user.click(screen.getByRole('button', { name: /Галерея/ }));

    const galleryTab = screen.getByRole('button', { name: /Галерея/ });
    expect(galleryTab).toHaveClass('bg-white');
  });

  it('switches back to mine tab', async () => {
    const user = userEvent.setup();
    renderWithProviders(<FunctionsPage />);

    await user.click(screen.getByRole('button', { name: /Галерея/ }));
    await user.click(screen.getByRole('button', { name: /Мои функции/ }));

    const mineTab = screen.getByRole('button', { name: /Мои функции/ });
    expect(mineTab).toHaveClass('bg-white');
  });

  it('renders page title', () => {
    renderWithProviders(<FunctionsPage />);
    expect(screen.getByText('Функции проверки')).toBeInTheDocument();
  });
});
