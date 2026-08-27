import { describe, it, expect } from 'vitest';
import { buildScratchBoard, findWinningRow, ROW_LINES, CELL_COUNT } from './scratch';

const people = (n) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, nickname: `참가${i}`, employeeId: `100${i}` }));

/** 판 전체에서 3개가 같은 선(가로/세로/대각)을 모두 찾는다. */
function allTriples(cells) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];
  return lines.filter(([a, b, c]) => cells[a].id === cells[b].id && cells[b].id === cells[c].id);
}

describe('buildScratchBoard', () => {
  it('9칸을 채우고 당첨자와 당첨 줄을 알려준다', () => {
    const board = buildScratchBoard(people(8));
    expect(board.cells).toHaveLength(CELL_COUNT);
    expect(board.winningRow).toBeGreaterThanOrEqual(0);
    expect(board.winningRow).toBeLessThan(3);
    expect(board.winner).toBeTruthy();
  });

  it('당첨 줄 세 칸은 모두 당첨자다', () => {
    const board = buildScratchBoard(people(8));
    const row = ROW_LINES[board.winningRow];
    expect(row.map((i) => board.cells[i].id)).toEqual([board.winner.id, board.winner.id, board.winner.id]);
  });

  it('3개 일치는 오직 당첨 줄 하나뿐 — 세로·대각으로도 생기지 않는다 (200판)', () => {
    for (let i = 0; i < 200; i += 1) {
      const board = buildScratchBoard(people(6));
      const triples = allTriples(board.cells);
      expect(triples).toHaveLength(1);
      expect(triples[0]).toEqual(ROW_LINES[board.winningRow]);
    }
  });

  it('대상이 2명뿐이어도 규칙을 지킨다 (100판)', () => {
    for (let i = 0; i < 100; i += 1) {
      const board = buildScratchBoard(people(2));
      expect(allTriples(board.cells)).toHaveLength(1);
      expect(findWinningRow(board.cells)).toBe(board.winningRow);
    }
  });

  it('당첨자를 지정하면 그 사람이 당첨된다', () => {
    const list = people(5);
    const board = buildScratchBoard(list, { winner: list[3] });
    expect(board.winner.id).toBe('p3');
    expect(ROW_LINES[board.winningRow].every((i) => board.cells[i].id === 'p3')).toBe(true);
  });

  it('당첨 줄은 매번 같은 자리에 오지 않는다', () => {
    const rows = new Set(Array.from({ length: 40 }, () => buildScratchBoard(people(6)).winningRow));
    expect(rows.size).toBeGreaterThan(1);
  });

  it('대상이 1명이면 판 전체가 그 사람 — 뽑을 다른 이름이 없다', () => {
    const board = buildScratchBoard(people(1));
    expect(board.cells.every((c) => c.id === 'p0')).toBe(true);
    expect(board.winner.id).toBe('p0');
  });

  it('대상이 없으면 판을 만들지 않는다', () => {
    expect(buildScratchBoard([])).toBeNull();
    expect(buildScratchBoard(null)).toBeNull();
  });

  it('사번을 칸에 실어 보낸다 — 사번 추첨에서 화면으로 확인할 수 있게', () => {
    const board = buildScratchBoard(people(4));
    expect(board.cells.every((c) => typeof c.employeeId === 'string')).toBe(true);
  });
});

describe('findWinningRow', () => {
  it('3개 일치가 없으면 null', () => {
    const cells = Array.from({ length: 9 }, (_, i) => ({ id: `x${i}`, nickname: `n${i}` }));
    expect(findWinningRow(cells)).toBeNull();
  });
});
