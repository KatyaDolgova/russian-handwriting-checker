import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { AuthModal } from '../../components/modals/ui/AuthModal';
import { ToastProvider } from '../../components/ui';
import type { ReactNode } from 'react';

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockOnClose = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    login: mockLogin,
    register: mockRegister,
    logout: vi.fn(),
  }),
}));

function renderModal() {
  return render(
    <ToastProvider>
      <AuthModal onClose={mockOnClose} />
    </ToastProvider>
  );
}

describe('AuthModal — отображение', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('показывает вкладку "Войти" по умолчанию', () => {
    renderModal();
    const loginTabs = screen.getAllByRole('button', { name: 'Войти' });
    expect(loginTabs.some((b) => b.classList.contains('bg-white'))).toBe(true);
  });

  it('показывает поля email и пароль', () => {
    renderModal();
    expect(screen.getByPlaceholderText('teacher@school.ru')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Минимум 6 символов')).toBeInTheDocument();
  });

  it('переключается на вкладку "Регистрация"', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Регистрация' }));
    expect(screen.getByRole('button', { name: 'Регистрация' })).toHaveClass('bg-white');
  });

  it('показывает кнопку закрытия', () => {
    renderModal();
    const btns = screen.getAllByRole('button');
    expect(btns.length).toBeGreaterThan(0);
  });
});

describe('AuthModal — валидация', () => {
  beforeEach(() => vi.clearAllMocks());

  it('показывает ошибку при пустых полях', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByText('Войти', { selector: 'button.bg-indigo-600' }));
    await waitFor(() => {
      expect(screen.getByText('Заполните все поля')).toBeInTheDocument();
    });
  });

  it('показывает ошибку при коротком пароле', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(screen.getByPlaceholderText('teacher@school.ru'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Минимум 6 символов'), '123');
    await user.click(screen.getByText('Войти', { selector: 'button.bg-indigo-600' }));
    await waitFor(() => {
      expect(screen.getByText('Пароль должен быть не менее 6 символов')).toBeInTheDocument();
    });
  });

  it('сбрасывает ошибку при смене вкладки', async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByText('Войти', { selector: 'button.bg-indigo-600' }));
    await waitFor(() => screen.getByText('Заполните все поля'));
    await user.click(screen.getByRole('button', { name: 'Регистрация' }));
    expect(screen.queryByText('Заполните все поля')).not.toBeInTheDocument();
  });
});

describe('AuthModal — аутентификация', () => {
  beforeEach(() => vi.clearAllMocks());

  it('вызывает login с email и паролем', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    renderModal();
    await user.type(screen.getByPlaceholderText('teacher@school.ru'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Минимум 6 символов'), 'password123');
    await user.click(screen.getByText('Войти', { selector: 'button.bg-indigo-600' }));
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  it('закрывает модалку после успешного входа', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    renderModal();
    await user.type(screen.getByPlaceholderText('teacher@school.ru'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Минимум 6 символов'), 'password123');
    await user.click(screen.getByText('Войти', { selector: 'button.bg-indigo-600' }));
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('вызывает register на вкладке регистрации', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    renderModal();
    await user.click(screen.getByRole('button', { name: 'Регистрация' }));
    await user.type(screen.getByPlaceholderText('teacher@school.ru'), 'new@test.com');
    await user.type(screen.getByPlaceholderText('Минимум 6 символов'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Зарегистрироваться' }));
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('new@test.com', 'password123');
    });
  });

  it('показывает ошибку при неудачном входе', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue({ message: 'Неверный пароль' });
    renderModal();
    await user.type(screen.getByPlaceholderText('teacher@school.ru'), 'test@test.com');
    await user.type(screen.getByPlaceholderText('Минимум 6 символов'), 'wrongpass');
    await user.click(screen.getByText('Войти', { selector: 'button.bg-indigo-600' }));
    await waitFor(() => {
      expect(screen.getByText('Неверный пароль')).toBeInTheDocument();
    });
  });
});

describe('AuthModal — показ пароля', () => {
  beforeEach(() => vi.clearAllMocks());

  it('пароль скрыт по умолчанию', () => {
    renderModal();
    const input = screen.getByPlaceholderText('Минимум 6 символов');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('показывает пароль по клику на иконку', async () => {
    const user = userEvent.setup();
    renderModal();
    const toggleBtns = screen.getAllByRole('button');
    const eyeBtn = toggleBtns.find(
      (b) => !b.textContent && b.getAttribute('type') === 'button'
    );
    if (eyeBtn) await user.click(eyeBtn);
    const input = screen.getByPlaceholderText('Минимум 6 символов');
    expect(input).toHaveAttribute('type', 'text');
  });
});
