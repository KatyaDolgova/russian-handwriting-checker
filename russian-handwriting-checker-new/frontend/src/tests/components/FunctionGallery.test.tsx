import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/helpers';
import FunctionGallery from '../../components/FunctionGallery';
import api from '../../api';

vi.mock('../../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

const mockApi = api as { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn> };

const GALLERY_FN = {
  id: 'fn-1',
  name: 'Проверка орфографии',
  description: 'Находит орфографические ошибки',
  system_prompt: 'Ты учитель',
  user_template: 'Проверь: {text}',
  author_display_name: 'Иван Иванов',
  author_user_id: 'author-uid',
  version_number: 2,
};

describe('FunctionGallery', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows loading state initially', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<FunctionGallery />);
    expect(screen.getByText('Загрузка галереи...')).toBeInTheDocument();
  });

  it('renders empty state when gallery is empty', async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    renderWithProviders(<FunctionGallery />);
    await waitFor(() => {
      expect(screen.getByText('Галерея пока пуста')).toBeInTheDocument();
    });
  });

  it('renders function cards from API', async () => {
    mockApi.get.mockResolvedValue({ data: [GALLERY_FN] });
    renderWithProviders(<FunctionGallery />);
    await waitFor(() => {
      expect(screen.getByText('Проверка орфографии')).toBeInTheDocument();
    });
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument();
    expect(screen.getByText('Находит орфографические ошибки')).toBeInTheDocument();
  });

  it('shows version badge', async () => {
    mockApi.get.mockResolvedValue({ data: [GALLERY_FN] });
    renderWithProviders(<FunctionGallery />);
    await waitFor(() => {
      expect(screen.getByText('v2')).toBeInTheDocument();
    });
  });

  it('renders search input', async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    renderWithProviders(<FunctionGallery />);
    expect(screen.getByPlaceholderText(/Поиск по названию/)).toBeInTheDocument();
  });

  it('shows "Добавить себе" button for each card', async () => {
    mockApi.get.mockResolvedValue({ data: [GALLERY_FN] });
    renderWithProviders(<FunctionGallery />);
    await waitFor(() => {
      expect(screen.getByText('Добавить себе')).toBeInTheDocument();
    });
  });

  it('calls copy API and shows "Добавлено" after click', async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: [GALLERY_FN] });
    mockApi.post.mockResolvedValue({ data: {} });

    renderWithProviders(<FunctionGallery />);
    await waitFor(() => screen.getByText('Добавить себе'));

    await user.click(screen.getByText('Добавить себе'));

    await waitFor(() => {
      expect(screen.getByText('Добавлено')).toBeInTheDocument();
    });
    expect(mockApi.post).toHaveBeenCalledWith('/api/functions/fn-1/copy');
  });

  it('disables copy button after successful copy', async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: [GALLERY_FN] });
    mockApi.post.mockResolvedValue({ data: {} });

    renderWithProviders(<FunctionGallery />);
    await waitFor(() => screen.getByText('Добавить себе'));
    await user.click(screen.getByText('Добавить себе'));

    await waitFor(() => {
      const btn = screen.getByText('Добавлено').closest('button');
      expect(btn).toBeDisabled();
    });
  });

  it('shows prompt on card expand', async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: [GALLERY_FN] });
    renderWithProviders(<FunctionGallery />);
    await waitFor(() => screen.getByText('Проверка орфографии'));

    await user.click(screen.getByText('Показать системный промпт'));
    expect(screen.getByText('Ты учитель')).toBeInTheDocument();
  });

  it('hides prompt on second click', async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: [GALLERY_FN] });
    renderWithProviders(<FunctionGallery />);
    await waitFor(() => screen.getByText('Проверка орфографии'));

    await user.click(screen.getByText('Показать системный промпт'));
    expect(screen.getByText('Скрыть промпт')).toBeInTheDocument();

    await user.click(screen.getByText('Скрыть промпт'));
    expect(screen.queryByText('Ты учитель')).not.toBeInTheDocument();
  });

  it('shows total count when results exist', async () => {
    mockApi.get.mockResolvedValue({ data: [GALLERY_FN] });
    renderWithProviders(<FunctionGallery />);
    await waitFor(() => {
      expect(screen.getByText(/Всего опубликовано: 1/)).toBeInTheDocument();
    });
  });

  it('shows "Ничего не найдено" on search with no results', async () => {
    const user = userEvent.setup();
    mockApi.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] });

    renderWithProviders(<FunctionGallery />);
    await waitFor(() => screen.getByText('Галерея пока пуста'));

    const input = screen.getByPlaceholderText(/Поиск по названию/);
    await user.type(input, 'несуществующее');

    await waitFor(() => {
      expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
    }, { timeout: 1500 });
  });

  it('shows clear button when search has text', async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: [] });
    renderWithProviders(<FunctionGallery />);

    const input = screen.getByPlaceholderText(/Поиск по названию/);
    await user.type(input, 'тест');
    expect(screen.getByText('×')).toBeInTheDocument();
  });

  it('clears search when × is clicked', async () => {
    const user = userEvent.setup();
    mockApi.get.mockResolvedValue({ data: [] });
    renderWithProviders(<FunctionGallery />);

    const input = screen.getByPlaceholderText(/Поиск по названию/);
    await user.type(input, 'тест');
    await user.click(screen.getByText('×'));
    expect(input).toHaveValue('');
  });
});
