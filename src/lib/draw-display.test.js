import { describe, it, expect } from 'vitest';
import { drawPrimary, drawSecondary, DRAW_DISPLAY } from './draw-display';

const both = { nickname: '홍길동', employeeId: '20260042' };
const idOnly = { nickname: '20260042', employeeId: '20260042' }; // 이름 없이 사번만 등록한 사람
const nameOnly = { nickname: '홍길동' };

describe('drawPrimary / drawSecondary', () => {
  it('이름 보기 — 이름이 크게, 사번이 작게', () => {
    expect(drawPrimary(both, DRAW_DISPLAY.NAME)).toBe('홍길동');
    expect(drawSecondary(both, DRAW_DISPLAY.NAME)).toBe('20260042');
  });

  it('사번 보기 — 사번이 크게, 이름이 작게', () => {
    expect(drawPrimary(both, DRAW_DISPLAY.EMPLOYEE_ID)).toBe('20260042');
    expect(drawSecondary(both, DRAW_DISPLAY.EMPLOYEE_ID)).toBe('홍길동');
  });

  it('사번만 등록된 사람은 어느 기준에서도 사번 하나만 보인다', () => {
    expect(drawPrimary(idOnly, DRAW_DISPLAY.NAME)).toBe('20260042');
    expect(drawSecondary(idOnly, DRAW_DISPLAY.NAME)).toBe('');
    expect(drawPrimary(idOnly, DRAW_DISPLAY.EMPLOYEE_ID)).toBe('20260042');
    expect(drawSecondary(idOnly, DRAW_DISPLAY.EMPLOYEE_ID)).toBe('');
  });

  it('사번이 없으면 사번 보기여도 이름으로 넘어간다 — 빈칸이 뜨지 않게', () => {
    expect(drawPrimary(nameOnly, DRAW_DISPLAY.EMPLOYEE_ID)).toBe('홍길동');
    expect(drawSecondary(nameOnly, DRAW_DISPLAY.EMPLOYEE_ID)).toBe('');
  });

  it('사람이 없으면 빈 문자열', () => {
    expect(drawPrimary(null, DRAW_DISPLAY.NAME)).toBe('');
    expect(drawSecondary(undefined, DRAW_DISPLAY.NAME)).toBe('');
  });
});
