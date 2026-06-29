import { describe, it, expect } from 'vitest';
import { QUESTION_TYPES, QUESTION_TYPE_MAP, TYPE_LABELS } from './question-types';

describe('question-types', () => {
  it('주관식(subjective) 유형이 포함됨', () => {
    expect(QUESTION_TYPES.find((t) => t.value === 'subjective')?.label).toBe('주관식');
  });

  it('모든 유형이 value/label/icon을 가짐', () => {
    for (const t of QUESTION_TYPES) {
      expect(t.value).toBeTruthy();
      expect(t.label).toBeTruthy();
      expect(t.icon).toBeTruthy();
    }
  });

  it('TYPE_LABELS / QUESTION_TYPE_MAP가 QUESTION_TYPES와 동기화됨', () => {
    expect(Object.keys(TYPE_LABELS).length).toBe(QUESTION_TYPES.length);
    expect(TYPE_LABELS.quiz).toBe('퀴즈');
    expect(QUESTION_TYPE_MAP.subjective.label).toBe('주관식');
  });

  it('value 중복 없음', () => {
    const values = QUESTION_TYPES.map((t) => t.value);
    expect(new Set(values).size).toBe(values.length);
  });
});
