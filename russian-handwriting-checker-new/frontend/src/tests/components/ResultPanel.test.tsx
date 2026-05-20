import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/helpers';
import ResultPanel from '../../components/ResultPanel';

vi.mock('../../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: { success: true } }),
    put: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { user_id: 'test-uid', email: 'test@test.com' },
    token: 'test-token',
  }),
}));

const CHECK_RESULT = {
  corrected_text: 'Привет, мир!',
  errors: [{ original: 'мир', corrected: 'мир!', type: 'пунктуация', comment: 'Нужна запятая' }],
  score: 80,
  score_max: 100,
  score_label: null,
  comment: 'Хорошая работа',
  html_highlighted: '',        // пустой — компонент покажет corrected_text
  is_generation: false,
  criteria: null,
};

const GENERATION_RESULT = {
  corrected_text: 'Это сгенерированный текст на тему урока.',
  errors: [],
  score: 0,
  score_max: 0,
  score_label: null,
  comment: '',
  html_highlighted: '',
  is_generation: true,
  criteria: null,
};

describe('ResultPanel — режим проверки', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders corrected text', () => {
    renderWithProviders(
      <ResultPanel result={CHECK_RESULT} originalText="Привет мир" filename="test.jpg" functionId="fn-1" />
    );
    expect(screen.getByText('Привет, мир!')).toBeInTheDocument();
  });

  it('renders comment', () => {
    renderWithProviders(
      <ResultPanel result={CHECK_RESULT} originalText="Привет мир" filename="test.jpg" functionId="fn-1" />
    );
    expect(screen.getByText('Хорошая работа')).toBeInTheDocument();
  });

  it('renders score value', () => {
    renderWithProviders(
      <ResultPanel result={CHECK_RESULT} originalText="Привет мир" filename="test.jpg" functionId="fn-1" />
    );
    // Score badge renders: "80" text node + <span>/ 5</span> — match by start
    expect(screen.getByText(/^80/)).toBeInTheDocument();
  });

  it('renders errors section with count', () => {
    renderWithProviders(
      <ResultPanel result={CHECK_RESULT} originalText="Привет мир" filename="test.jpg" functionId="fn-1" />
    );
    expect(screen.getByText(/Ошибки/i)).toBeInTheDocument();
    expect(screen.getByText('мир')).toBeInTheDocument();
  });

  it('renders error details', () => {
    renderWithProviders(
      <ResultPanel result={CHECK_RESULT} originalText="Привет мир" filename="test.jpg" functionId="fn-1" />
    );
    expect(screen.getByText('Нужна запятая')).toBeInTheDocument();
  });

  it('shows save button', () => {
    renderWithProviders(
      <ResultPanel result={CHECK_RESULT} originalText="Привет мир" filename="test.jpg" functionId="fn-1" />
    );
    expect(screen.getByText(/Сохранить/)).toBeInTheDocument();
  });

  it('shows print button', () => {
    renderWithProviders(
      <ResultPanel result={CHECK_RESULT} originalText="Привет мир" filename="test.jpg" functionId="fn-1" />
    );
    expect(screen.getByText('Печать')).toBeInTheDocument();
  });

  it('shows "Оценка" section label', () => {
    renderWithProviders(
      <ResultPanel result={CHECK_RESULT} originalText="Привет мир" filename="test.jpg" functionId="fn-1" />
    );
    expect(screen.getByText(/Оценка/i)).toBeInTheDocument();
  });

  it('shows toggle between original and corrected', () => {
    renderWithProviders(
      <ResultPanel result={CHECK_RESULT} originalText="Привет мир" filename="test.jpg" functionId="fn-1" />
    );
    expect(screen.getByText('С ошибками')).toBeInTheDocument();
    expect(screen.getByText('Исправленный')).toBeInTheDocument();
  });
});

describe('ResultPanel — режим генерации', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders generated text', () => {
    renderWithProviders(
      <ResultPanel result={GENERATION_RESULT} originalText="" filename="gen.jpg" functionId="fn-gen" />
    );
    // Generated text is in a <textarea> — use getByDisplayValue
    expect(screen.getByDisplayValue(/Это сгенерированный текст/)).toBeInTheDocument();
  });

  it('shows "Сгенерированный результат" label', () => {
    renderWithProviders(
      <ResultPanel result={GENERATION_RESULT} originalText="" filename="gen.jpg" functionId="fn-gen" />
    );
    expect(screen.getByText('Сгенерированный результат')).toBeInTheDocument();
  });

  it('does not show score section', () => {
    renderWithProviders(
      <ResultPanel result={GENERATION_RESULT} originalText="" filename="gen.jpg" functionId="fn-gen" />
    );
    expect(screen.queryByText(/^Оценка$/i)).not.toBeInTheDocument();
  });

  it('does not show errors toggle (С ошибками / Исправленный)', () => {
    renderWithProviders(
      <ResultPanel result={GENERATION_RESULT} originalText="" filename="gen.jpg" functionId="fn-gen" />
    );
    expect(screen.queryByText('С ошибками')).not.toBeInTheDocument();
    expect(screen.queryByText('Исправленный')).not.toBeInTheDocument();
  });

  it('shows save button', () => {
    renderWithProviders(
      <ResultPanel result={GENERATION_RESULT} originalText="" filename="gen.jpg" functionId="fn-gen" />
    );
    expect(screen.getByText(/Сохранить/)).toBeInTheDocument();
  });
});

describe('ResultPanel — редактирование', () => {
  beforeEach(() => vi.clearAllMocks());

  it('enters edit mode on button click', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderWithProviders(
      <ResultPanel result={CHECK_RESULT} originalText="Привет мир" filename="test.jpg" functionId="fn-1" />
    );
    await user.click(screen.getByText('Редактировать'));
    // В режиме редактирования кнопка меняется на «Просмотр»
    expect(screen.getByText('Просмотр')).toBeInTheDocument();
  });

  it('exits edit mode on second click', async () => {
    const user = userEvent.setup({ writeToClipboard: false });
    renderWithProviders(
      <ResultPanel result={CHECK_RESULT} originalText="Привет мир" filename="test.jpg" functionId="fn-1" />
    );
    await user.click(screen.getByText('Редактировать'));
    await user.click(screen.getByText('Просмотр'));
    expect(screen.queryByText('Просмотр')).not.toBeInTheDocument();
    expect(screen.getByText('Редактировать')).toBeInTheDocument();
  });
});
