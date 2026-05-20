import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@testing-library/react';
import { StudentsPage } from '../../pages/ui/StudentsPage';
import { ToastProvider } from '../../components/ui';

vi.mock('../../components/panels', () => ({
  StudentsPanel: () => <div data-testid="students-panel">StudentsPanel</div>,
}));

vi.mock('../../api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

const mockUseAuth = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderPage() {
  return render(
    <ToastProvider>
      <StudentsPage />
    </ToastProvider>
  );
}

describe('StudentsPage — без авторизации', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: null, token: null });
  });

  it('показывает сообщение о необходимости входа', () => {
    renderPage();
    expect(screen.getByText('Войдите, чтобы видеть статистику учеников')).toBeInTheDocument();
  });

  it('не показывает StudentsPanel', () => {
    renderPage();
    expect(screen.queryByTestId('students-panel')).not.toBeInTheDocument();
  });
});

describe('StudentsPage — с авторизацией', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: { user_id: 'test-uid', email: 'test@test.com' },
      token: 'test-token',
    });
  });

  it('показывает заголовок страницы', () => {
    renderPage();
    expect(screen.getByText('Статистика учеников')).toBeInTheDocument();
  });

  it('рендерит StudentsPanel', () => {
    renderPage();
    expect(screen.getByTestId('students-panel')).toBeInTheDocument();
  });

  it('не показывает сообщение о необходимости входа', () => {
    renderPage();
    expect(
      screen.queryByText('Войдите, чтобы видеть статистику учеников')
    ).not.toBeInTheDocument();
  });
});
