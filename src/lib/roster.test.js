import { describe, it, expect } from 'vitest';
import { parseRosterText, normalizeRosterRows, rosterDisplayName, selectRosterRows, ROSTER_MAX_ROWS } from './roster';

describe('parseRosterText', () => {
  it('엑셀 탭 복사 — 이름/사번 두 칸', () => {
    expect(parseRosterText('홍길동\t12345\n김철수\t23456')).toEqual([
      { name: '홍길동', employeeId: '12345' },
      { name: '김철수', employeeId: '23456' },
    ]);
  });

  it('사번만 있는 목록 — 이름 없이 사번으로 인식', () => {
    expect(parseRosterText('1111\n2222\n3333')).toEqual([
      { name: '', employeeId: '1111' },
      { name: '', employeeId: '2222' },
      { name: '', employeeId: '3333' },
    ]);
  });

  it('쉼표(CSV)와 한 칸 띄어쓰기도 같은 결과', () => {
    expect(parseRosterText('홍길동,12345')).toEqual([{ name: '홍길동', employeeId: '12345' }]);
    expect(parseRosterText('홍길동 12345')).toEqual([{ name: '홍길동', employeeId: '12345' }]);
  });

  it('사번이 앞에 온 명단은 뒤집어 인식', () => {
    expect(parseRosterText('12345\t홍길동')).toEqual([{ name: '홍길동', employeeId: '12345' }]);
  });

  it('빈 줄과 공백 줄은 건너뛴다', () => {
    expect(parseRosterText('홍길동\t1\n\n   \n김철수\t2')).toHaveLength(2);
  });

  it('이름 10자 / 사번 20자를 넘으면 잘라 저장한다 (DB rules 상한)', () => {
    const [row] = parseRosterText(`${'가'.repeat(15)}\t${'9'.repeat(30)}`);
    expect(row.name).toHaveLength(10);
    expect(row.employeeId).toHaveLength(20);
  });

  it('상한을 넘는 줄은 버린다', () => {
    const text = Array.from({ length: ROSTER_MAX_ROWS + 20 }, (_, i) => `n${i}`).join('\n');
    expect(parseRosterText(text)).toHaveLength(ROSTER_MAX_ROWS);
  });

  it('빈 입력은 빈 배열', () => {
    expect(parseRosterText('')).toEqual([]);
    expect(parseRosterText('   \n  ')).toEqual([]);
    expect(parseRosterText(null)).toEqual([]);
  });
});

describe('normalizeRosterRows', () => {
  it('빈 행을 버린다', () => {
    const { rows } = normalizeRosterRows([
      { name: '홍길동', employeeId: '1' },
      { name: '', employeeId: '' },
      { name: '  ', employeeId: '  ' },
    ]);
    expect(rows).toHaveLength(1);
  });

  it('사번 중복은 먼저 온 행만 남기고 알린다', () => {
    const { rows, duplicates } = normalizeRosterRows([
      { name: '홍길동', employeeId: '1' },
      { name: '동명이인', employeeId: '1' },
      { name: '김철수', employeeId: '2' },
    ]);
    expect(rows.map((r) => r.name)).toEqual(['홍길동', '김철수']);
    expect(duplicates).toEqual(['1']);
  });

  it('사번 없는 행은 중복 판정에서 제외 — 이름만 있는 명단도 허용', () => {
    const { rows, duplicates } = normalizeRosterRows([
      { name: '홍길동', employeeId: '' },
      { name: '김철수', employeeId: '' },
    ]);
    expect(rows).toHaveLength(2);
    expect(duplicates).toEqual([]);
  });

  it('기존 행의 id는 보존한다 — 수정 시 참여자 노드를 새로 만들지 않기 위해', () => {
    const { rows } = normalizeRosterRows([{ id: 'manual_a', name: '홍길동', employeeId: '1' }]);
    expect(rows[0].id).toBe('manual_a');
  });
});

describe('rosterDisplayName', () => {
  it('이름이 있으면 이름', () => {
    expect(rosterDisplayName({ name: '홍길동', employeeId: '12345' })).toBe('홍길동');
  });

  it('이름이 없으면 사번이 표시 이름', () => {
    expect(rosterDisplayName({ name: '', employeeId: '12345' })).toBe('12345');
  });

  it('긴 사번은 표시 이름에서만 잘린다', () => {
    expect(rosterDisplayName({ name: '', employeeId: '123456789012345' })).toBe('1234567890');
  });
});

describe('selectRosterRows', () => {
  const participants = {
    joined_1: { nickname: '입장한학생', online: true },
    manual_b: { nickname: '김철수', employeeId: '2', source: 'manual', order: 1 },
    manual_a: { nickname: '홍길동', employeeId: '1', source: 'manual', order: 0 },
  };

  it('강사가 입력한 명단만 고른다 — 입장한 참여자는 제외', () => {
    expect(selectRosterRows(participants).map((r) => r.id)).toEqual(['manual_a', 'manual_b']);
  });

  it('입력 순서(order)를 유지한다', () => {
    expect(selectRosterRows(participants).map((r) => r.name)).toEqual(['홍길동', '김철수']);
  });

  it('이름 없이 사번만 넣은 행은 이름 칸을 비워 되돌린다', () => {
    const rows = selectRosterRows({
      manual_c: { nickname: '12345', employeeId: '12345', source: 'manual', order: 0 },
    });
    expect(rows[0]).toEqual({ id: 'manual_c', name: '', employeeId: '12345' });
  });

  it('명단이 없으면 빈 배열', () => {
    expect(selectRosterRows({})).toEqual([]);
    expect(selectRosterRows(null)).toEqual([]);
  });
});
