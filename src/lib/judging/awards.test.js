import { describe, it, expect } from 'vitest';
import { calculateLiveTop3, calculateAwards } from './awards';

// 특성화 테스트 — 시상 정렬·동점 처리·실패 제출 제외 동작을 고정.
const mk = (id, name, avg, results) => ({
  submissionId: id,
  name,
  summary: { avgScore: avg, totalJudges: Object.keys(results).length },
  results,
});
const judge = (score, comment = '', extra = {}) => ({ score, comment, ...extra });

describe('calculateLiveTop3', () => {
  it('빈 입력 → {}', () => expect(calculateLiveTop3([])).toEqual({}));

  it('avgScore 내림차순으로 1·2·3등', () => {
    const r = calculateLiveTop3([
      mk('a', '가', 3.0, { j1: judge(3) }),
      mk('b', '나', 4.5, { j1: judge(4.5) }),
      mk('c', '다', 4.0, { j1: judge(4) }),
    ]);
    expect(r.first.submissionId).toBe('b');
    expect(r.second.submissionId).toBe('c');
    expect(r.third.submissionId).toBe('a');
  });

  it('totalJudges=0(전 판사 실패)인 제출은 순위에서 제외', () => {
    const r = calculateLiveTop3([
      mk('a', '가', 4.0, { j1: judge(4) }),
      { submissionId: 'z', name: '실패', summary: { avgScore: 0, totalJudges: 0 }, results: {} },
    ]);
    expect(r.first.submissionId).toBe('a');
    expect(r.second).toBeUndefined();
  });

  it('avgScore 동점 → 최고 판사점수, 그래도 동점이면 이름순 (결정적)', () => {
    const r = calculateLiveTop3([
      mk('a', '나', 4.0, { j1: judge(4), j2: judge(4) }),     // top 4
      mk('b', '가', 4.0, { j1: judge(5), j2: judge(3) }),     // top 5 → 우선
    ]);
    expect(r.first.submissionId).toBe('b'); // 최고 판사점수 5가 더 높음
  });

  it('대표 코멘트는 최고 점수 판사의 것', () => {
    const r = calculateLiveTop3([
      mk('a', '가', 4.0, { j1: judge(3, '낮음'), j2: judge(5, '높음') }),
    ]);
    expect(r.first.comment).toBe('높음');
    expect(r.first.topScore).toBe(5);
  });

  it('error 판사 결과는 대표 코멘트 선정에서 제외', () => {
    const r = calculateLiveTop3([
      mk('a', '가', 4.0, { j1: judge(5, '정상'), j2: { error: true, score: 9, comment: '에러' } }),
    ]);
    expect(r.first.comment).toBe('정상');
  });
});

describe('calculateAwards', () => {
  it('상위 3 → grand/excellence/outstanding', () => {
    const r = calculateAwards([
      mk('a', '가', 5.0, { 'kim-gihoek': judge(5) }),
      mk('b', '나', 4.0, { 'kim-gihoek': judge(4) }),
      mk('c', '다', 3.0, { 'kim-gihoek': judge(3) }),
    ]);
    expect(r.grand.submissionId).toBe('a');
    expect(r.excellence.submissionId).toBe('b');
    expect(r.outstanding.submissionId).toBe('c');
  });

  it('특별상은 상위권 제외 후 판사별 최고점자에게', () => {
    const r = calculateAwards([
      mk('a', '가', 5.0, { 'kim-gihoek': judge(5) }),
      mk('b', '나', 4.9, { 'kim-gihoek': judge(4.9) }),
      mk('c', '다', 4.8, { 'kim-gihoek': judge(4.8) }),
      mk('d', '라', 2.0, { 'lee-dija': judge(9) }), // 디자인 판사 최고점, 상위권 아님
    ]);
    expect(r.design.submissionId).toBe('d');
  });
});
