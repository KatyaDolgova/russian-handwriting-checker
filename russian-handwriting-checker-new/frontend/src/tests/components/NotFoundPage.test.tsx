import React from 'react';
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { NotFoundPage } from '@/pages';

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  it('отображает код ошибки 404', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('отображает сообщение о несуществующей странице', () => {
    renderNotFound();
    expect(screen.getByText('Страница не найдена')).toBeInTheDocument();
  });

  it('отображает пояснительный текст', () => {
    renderNotFound();
    expect(
      screen.getByText(/Такой страницы не существует/),
    ).toBeInTheDocument();
  });

  it('содержит ссылку на главную страницу', () => {
    renderNotFound();
    const link = screen.getByRole('link', { name: /На главную/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });
});
