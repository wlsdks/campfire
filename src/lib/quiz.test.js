import { describe, it, expect } from 'vitest';
import {
  getQuizReward,
  normalizeQuizEvent,
  getQuizEventBadges,
  isQuizQuestion,
  getQuestionMode,
  QUIZ_DEFAULTS,
} from './quiz';

// 특성화 테스트 — 리팩터 시 점수 계산이 바뀌지 않도록 현재 동작을 고정한다.
describe('getQuizReward', () => {
  const base = { type: 'quiz', correctAnswer: 'A', activatedAt: 1000 };

  it('정답 + 즉시 제출 → 기본100 + 속도보너스50, 티켓 참여1+정답2=3', () => {
    const r = getQuizReward(base, { value: 'A', timestamp: 1000 });
    expect(r.isCorrect).toBe(true);
    expect(r.points).toBe(150);
    expect(r.tickets).toBe(3);
  });

  it('정답 + 속도창 절반 경과 → 속도보너스 절반(25)', () => {
    const r = getQuizReward(base, { value: 'A', timestamp: 1000 + 15000 });
    expect(r.points).toBe(125);
  });

  it('정답 + 속도창 초과 → 속도보너스 0, 기본점수만', () => {
    const r = getQuizReward(base, { value: 'A', timestamp: 1000 + 40000 });
    expect(r.points).toBe(100);
  });

  it('오답(베팅 없음) → 0점, 참여티켓만(1)', () => {
    const r = getQuizReward(base, { value: 'B', timestamp: 2000 });
    expect(r.isCorrect).toBe(false);
    expect(r.points).toBe(0);
    expect(r.tickets).toBe(1);
  });

  it('미응답(vote 없음) → 0점, 0티켓', () => {
    const r = getQuizReward(base, undefined);
    expect(r.isCorrect).toBe(false);
    expect(r.points).toBe(0);
    expect(r.tickets).toBe(0);
  });

  it('베팅 활성 + 올인(3x) 오답 → 페널티 -60', () => {
    const r = getQuizReward({ ...base, betting: true }, { value: 'B', bet: '3', timestamp: 2000 });
    expect(r.points).toBe(-60);
  });

  it('베팅 활성 + 2x 정답(즉시) → 150 × 2 = 300', () => {
    const r = getQuizReward({ ...base, betting: true }, { value: 'A', bet: '2', timestamp: 1000 });
    expect(r.points).toBe(300);
  });

  it('double-points 이벤트 + 정답(즉시) → 150 × 2 = 300, 점수 멀티플라이어 적용', () => {
    const r = getQuizReward({ ...base, event: 'double-points' }, { value: 'A', timestamp: 1000 });
    expect(r.points).toBe(300);
  });

  it('ticket-rush 이벤트 정답 → 정답티켓에 +2 추가 (1 + 2+2 = 5)', () => {
    const r = getQuizReward({ ...base, event: 'ticket-rush' }, { value: 'A', timestamp: 1000 });
    expect(r.tickets).toBe(5);
  });
});

describe('normalizeQuizEvent', () => {
  it('null → null', () => expect(normalizeQuizEvent(null)).toBeNull());
  it('문자열 id → preset 객체', () => {
    expect(normalizeQuizEvent('double-points')).toMatchObject({ id: 'double-points', pointMultiplier: 2 });
  });
  it('객체 + id → preset과 병합', () => {
    const r = normalizeQuizEvent({ id: 'ticket-rush', extra: 1 });
    expect(r.correctBonusTickets).toBe(2);
    expect(r.extra).toBe(1);
  });
});

describe('getQuizEventBadges', () => {
  it('double-points → 2배 점수 배지', () => {
    expect(getQuizEventBadges('double-points')).toContain('2배 점수');
  });
  it('ticket-rush → 정답 티켓 배지', () => {
    expect(getQuizEventBadges('ticket-rush')).toContain('정답 +2 티켓');
  });
  it('없으면 빈 배열', () => expect(getQuizEventBadges(null)).toEqual([]));
});

describe('타입 판별', () => {
  it('isQuizQuestion', () => {
    expect(isQuizQuestion({ type: 'quiz' })).toBe(true);
    expect(isQuizQuestion({ type: 'choice' })).toBe(false);
  });
  it('getQuestionMode', () => {
    expect(getQuestionMode({ type: 'quiz' })).toBe('quiz');
    expect(getQuestionMode({ type: 'check' })).toBe('poll');
    expect(getQuestionMode({ type: 'choice' })).toBe('poll');
  });
  it('QUIZ_DEFAULTS 불변', () => {
    expect(QUIZ_DEFAULTS).toMatchObject({ points: 100, maxSpeedBonus: 50, speedWindowMs: 30000 });
  });
});
