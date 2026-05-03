import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/helpers';
import FunctionManager from '../../components/FunctionManager';
import api from '../../api';

vi.mock('../../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { user_id: 'test-uid', email: 'test@test.com' },
    token: 'test-token',
  }),
}));

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const DEFAULT_FN = {
  id: 'default-1',
  name: 'Стандартная проверка',
  description: 'Системная функция',
  system_prompt: 'Ты учитель',
  user_template: 'Проверь: {text}',
  is_default: true,
  is_published: false,
  user_id: null,
  original_function_id: null,
};

const USER_FN = {
  id: 'user-fn-1',
  name: 'Моя функция',
  description: 'Пользовательская',
  system_prompt: 'Мой промпт',
  user_template: '{text}',
  is_default: false,
  is_published: false,
  user_id: 'test-uid',
  original_function_id: null,
};

describe('FunctionManager', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state initially', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<FunctionManager />);
    expect(screen.getByText(/Загрузка/i)).toBeInTheDocument();
  });

  it('renders default functions section', async () => {
    mockApi.get.mockResolvedValue({ data: [DEFAULT_FN] });
    renderWithProviders(<FunctionManager />);
    await waitFor(() => {
      expect(screen.getByText('Стандартные функции')).toBeInTheDocument();
    });
  });

  it('renders default function name', async () => {
    mockApi.get.mockResolvedValue({ data: [DEFAULT_FN] });
    renderWithProviders(<FunctionManager />);
    await waitFor(() => {
      expect(screen.getByText('Стандартная проверка')).toBeInTheDocument();
    });
  });

  it('renders user functions section when user has functions', async () => {
    mockApi.get.mockResolvedValue({ data: [USER_FN] });
    renderWithProviders(<FunctionManager />);
    await waitFor(() => {
      expect(screen.getByText('Мои функции')).toBeInTheDocument();
      expect(screen.getByText('Моя функция')).toBeInTheDocument();
    });
  });

  it('shows create button', async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    renderWithProviders(<FunctionManager />);
    await waitFor(() => {
      expect(screen.getByText('Создать')).toBeInTheDocument();
    });
  });

  it('opens create form on button click', async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: [] });
    renderWithProviders(<FunctionManager />);
    await waitFor(() => screen.getByText('Создать'));

    await user.click(screen.getByText('Создать'));
    expect(screen.getByPlaceholderText('Проверка диктанта')).toBeInTheDocument();
  });

  it('closes create form on cancel', async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: [] });
    renderWithProviders(<FunctionManager />);
    await waitFor(() => screen.getByText('Создать'));

    await user.click(screen.getByText('Создать'));
    await user.click(screen.getByText('Отмена'));
    expect(screen.queryByPlaceholderText('Проверка диктанта')).not.toBeInTheDocument();
  });

  it('creates function via API on form submit', async () => {
    const user = userEvent.setup();
    const newFn = { ...USER_FN, id: 'new-fn', name: 'Новая функция тест' };
    mockApi.get.mockResolvedValue({ data: [] });
    mockApi.post.mockResolvedValue({ data: newFn });

    renderWithProviders(<FunctionManager />);
    await waitFor(() => screen.getByText('Создать'));
    await user.click(screen.getByText('Создать'));

    // Заполняем название (обязательно)
    await user.type(screen.getByPlaceholderText('Проверка диктанта'), 'Новая функция тест');
    // Заполняем системный промпт (обязательно — без него форма не отправится)
    await user.type(
      screen.getByPlaceholderText(/Ты — опытный учитель/),
      'Проверь текст.',
    );

    mockApi.get.mockResolvedValue({ data: [newFn] });
    await user.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      expect(mockApi.post).toHaveBeenCalledWith('/api/functions/', expect.objectContaining({
        name: 'Новая функция тест',
      }));
    });
  });

  it('shows no edit/delete buttons on default functions', async () => {
    mockApi.get.mockResolvedValue({ data: [DEFAULT_FN] });
    renderWithProviders(<FunctionManager />);
    await waitFor(() => screen.getByText('Стандартная проверка'));
    expect(screen.queryAllByTitle('Редактировать').length).toBe(0);
  });

  it('shows edit button for user functions', async () => {
    mockApi.get.mockResolvedValue({ data: [USER_FN] });
    renderWithProviders(<FunctionManager />);
    await waitFor(() => screen.getByText('Моя функция'));
    expect(screen.getAllByTitle('Редактировать').length).toBeGreaterThan(0);
  });

  it('shows publish button for user functions', async () => {
    mockApi.get.mockResolvedValue({ data: [USER_FN] });
    renderWithProviders(<FunctionManager />);
    await waitFor(() => screen.getByText('Моя функция'));
    expect(screen.getByTitle('Опубликовать в галерею')).toBeInTheDocument();
  });

  it('shows "опубликована" badge for published function', async () => {
    const publishedFn = { ...USER_FN, is_published: true };
    mockApi.get.mockResolvedValue({ data: [publishedFn] });
    renderWithProviders(<FunctionManager />);
    await waitFor(() => {
      expect(screen.getByText('опубликована')).toBeInTheDocument();
    });
  });

  it('shows "скопировано" badge for copied function', async () => {
    const copiedFn = { ...USER_FN, original_function_id: 'some-original' };
    mockApi.get.mockResolvedValue({ data: [copiedFn] });
    renderWithProviders(<FunctionManager />);
    await waitFor(() => {
      expect(screen.getByText('скопировано')).toBeInTheDocument();
    });
  });
});
