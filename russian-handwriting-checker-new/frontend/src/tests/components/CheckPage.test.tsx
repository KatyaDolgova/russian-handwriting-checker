import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/helpers';
import { CheckPage } from '../../pages/ui/CheckPage';
import type { CheckState } from '../../App';

vi.mock('../../components/ui', () => ({
  UploadForm: ({
    onTaskCreated,
  }: {
    onTaskCreated: (taskId: string, filename: string) => void;
  }) => (
    <button onClick={() => onTaskCreated('task-123', 'file.jpg')}>Загрузить файл</button>
  ),
  StreamingPreview: ({ text }: { text: string }) => (
    <div data-testid="streaming-preview">{text}</div>
  ),
  TextEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea data-testid="text-editor" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
  EmptyResult: () => <div data-testid="empty-result">Пусто</div>,
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../../components/panels', () => ({
  CheckPanel: () => <div data-testid="check-panel">CheckPanel</div>,
  ResultPanel: () => <div data-testid="result-panel">ResultPanel</div>,
}));

const INIT_STATE: CheckState = {
  editedText: '',
  sourceText: '',
  streamText: '',
  result: null,
  filename: '',
  functionId: '',
  rightState: 'empty',
  uploadStatus: 'idle',
  uploadTaskId: null,
  uploadFilename: '',
  uploadError: '',
};

function makeState(overrides: Partial<CheckState> = {}): CheckState {
  return { ...INIT_STATE, ...overrides };
}

describe('CheckPage — пустое состояние', () => {
  beforeEach(() => vi.clearAllMocks());

  it('показывает EmptyResult при rightState="empty"', () => {
    const setState = vi.fn();
    renderWithProviders(<CheckPage state={makeState()} setState={setState} />);
    expect(screen.getByTestId('empty-result')).toBeInTheDocument();
  });

  it('рендерит UploadForm', () => {
    renderWithProviders(<CheckPage state={makeState()} setState={vi.fn()} />);
    expect(screen.getByText('Загрузить файл')).toBeInTheDocument();
  });

  it('рендерит TextEditor', () => {
    renderWithProviders(<CheckPage state={makeState()} setState={vi.fn()} />);
    expect(screen.getByTestId('text-editor')).toBeInTheDocument();
  });

  it('рендерит CheckPanel', () => {
    renderWithProviders(<CheckPage state={makeState()} setState={vi.fn()} />);
    expect(screen.getByTestId('check-panel')).toBeInTheDocument();
  });
});

describe('CheckPage — правая панель', () => {
  beforeEach(() => vi.clearAllMocks());

  it('показывает StreamingPreview при rightState="streaming"', () => {
    renderWithProviders(
      <CheckPage
        state={makeState({ rightState: 'streaming', streamText: 'Идёт проверка...' })}
        setState={vi.fn()}
      />
    );
    expect(screen.getByTestId('streaming-preview')).toBeInTheDocument();
    expect(screen.getByText('Идёт проверка...')).toBeInTheDocument();
  });

  it('показывает ResultPanel при rightState="result"', () => {
    renderWithProviders(
      <CheckPage
        state={makeState({ rightState: 'result', result: { score: 80 } })}
        setState={vi.fn()}
      />
    );
    expect(screen.getByTestId('result-panel')).toBeInTheDocument();
  });

  it('не показывает StreamingPreview при rightState="empty"', () => {
    renderWithProviders(<CheckPage state={makeState()} setState={vi.fn()} />);
    expect(screen.queryByTestId('streaming-preview')).not.toBeInTheDocument();
  });

  it('не показывает ResultPanel при rightState="empty"', () => {
    renderWithProviders(<CheckPage state={makeState()} setState={vi.fn()} />);
    expect(screen.queryByTestId('result-panel')).not.toBeInTheDocument();
  });
});

describe('CheckPage — исходный текст', () => {
  beforeEach(() => vi.clearAllMocks());

  it('показывает кнопку "Добавить исходный текст"', () => {
    renderWithProviders(<CheckPage state={makeState()} setState={vi.fn()} />);
    expect(screen.getByText(/Добавить исходный текст/)).toBeInTheDocument();
  });

  it('показывает textarea исходного текста после клика', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CheckPage state={makeState()} setState={vi.fn()} />);
    await user.click(screen.getByText(/Добавить исходный текст/));
    expect(screen.getByText('Исходный текст')).toBeInTheDocument();
  });

  it('скрывает textarea после нажатия кнопки X', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CheckPage state={makeState()} setState={vi.fn()} />);
    await user.click(screen.getByText(/Добавить исходный текст/));
    const closeBtn = screen.getByTitle('Убрать поле');
    await user.click(closeBtn);
    expect(screen.queryByText('Исходный текст')).not.toBeInTheDocument();
  });
});

describe('CheckPage — загрузка файла', () => {
  it('переводит состояние в processing после создания задачи', async () => {
    const user = userEvent.setup();
    const setState = vi.fn();
    renderWithProviders(<CheckPage state={makeState()} setState={setState} />);
    await user.click(screen.getByText('Загрузить файл'));
    expect(setState).toHaveBeenCalled();
    const updater = setState.mock.calls[0][0];
    const newState = updater(INIT_STATE);
    expect(newState.uploadStatus).toBe('processing');
    expect(newState.uploadTaskId).toBe('task-123');
    expect(newState.uploadFilename).toBe('file.jpg');
  });
});
