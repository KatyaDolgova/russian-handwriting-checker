import { describe, it, expect } from 'vitest';

// ── Утилиты, встроенные в компоненты ─────────────────────────────────────────

function scoreColor(pct: number) {
  return pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'red';
}

function calcAvgPct(checks: { score: number | null; score_max: number | null }[]) {
  const scored = checks.filter(c => c.score != null && c.score_max != null);
  if (!scored.length) return 0;
  const total = scored.reduce((s, c) => s + (c.score! / c.score_max!) * 100, 0);
  return Math.round(total / scored.length);
}

function formatVersionDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function scoreBadgeColor(score: number, max: number) {
  const pct = max > 0 ? score / max : 0;
  if (pct >= 0.8) return 'emerald';
  if (pct >= 0.5) return 'amber';
  return 'red';
}

// ── Тесты ────────────────────────────────────────────────────────────────────

describe('scoreColor', () => {
  it('returns emerald for high scores', () => {
    expect(scoreColor(80)).toBe('emerald');
    expect(scoreColor(100)).toBe('emerald');
  });

  it('returns amber for medium scores', () => {
    expect(scoreColor(50)).toBe('amber');
    expect(scoreColor(79)).toBe('amber');
  });

  it('returns red for low scores', () => {
    expect(scoreColor(0)).toBe('red');
    expect(scoreColor(49)).toBe('red');
  });
});

describe('calcAvgPct', () => {
  it('calculates average percentage correctly', () => {
    const checks = [
      { score: 80, score_max: 100 },
      { score: 60, score_max: 100 },
    ];
    expect(calcAvgPct(checks)).toBe(70);
  });

  it('skips null scores (generation results)', () => {
    const checks = [
      { score: 80, score_max: 100 },
      { score: null, score_max: null },
    ];
    expect(calcAvgPct(checks)).toBe(80);
  });

  it('returns 0 when all scores are null', () => {
    const checks = [
      { score: null, score_max: null },
    ];
    expect(calcAvgPct(checks)).toBe(0);
  });

  it('returns 0 for empty list', () => {
    expect(calcAvgPct([])).toBe(0);
  });

  it('works with non-100 max scores', () => {
    const checks = [{ score: 4, score_max: 5 }];
    expect(calcAvgPct(checks)).toBe(80);
  });
});

describe('scoreBadgeColor', () => {
  it('returns emerald for 80%+', () => {
    expect(scoreBadgeColor(8, 10)).toBe('emerald');
    expect(scoreBadgeColor(10, 10)).toBe('emerald');
  });

  it('returns amber for 50-79%', () => {
    expect(scoreBadgeColor(5, 10)).toBe('amber');
    expect(scoreBadgeColor(7, 10)).toBe('amber');
  });

  it('returns red for below 50%', () => {
    expect(scoreBadgeColor(4, 10)).toBe('red');
    expect(scoreBadgeColor(0, 10)).toBe('red');
  });

  it('handles zero max gracefully', () => {
    expect(scoreBadgeColor(0, 0)).toBe('red');
  });
});

describe('formatVersionDate', () => {
  it('formats ISO date to Russian locale string', () => {
    const iso = '2025-01-15T10:30:00';
    const result = formatVersionDate(iso);
    expect(result).toContain('15');
    expect(result).toContain('01');
    expect(result).toContain('2025');
  });

  it('includes time in output', () => {
    const iso = '2025-06-01T09:05:00';
    const result = formatVersionDate(iso);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });
});
