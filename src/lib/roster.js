/**
 * 추첨 명단(roster) 텍스트 파서.
 *
 * 존재 이유: 추첨 전용 세션에는 입장하는 참여자가 없다. 명단은 강사가 직접 넣는데,
 * 실무에서 오는 형태가 제각각이다 — 엑셀에서 두 칸을 긁으면 탭, CSV로 받으면 쉼표,
 * 사번만 있는 목록은 줄바꿈뿐이다. 세 경우를 모두 한 파서로 받는다.
 *
 * 길이 상한은 database.rules.json의 participants/$id 검증과 같은 값이다.
 * 여기서 잘라두지 않으면 저장 시점에 Firebase가 write 전체를 거부한다.
 */

/** participants/$participantId/nickname — rules상 1~10자 */
export const ROSTER_NAME_MAX = 10;
/** participants/$participantId/employeeId — rules상 최대 20자 */
export const ROSTER_EMPLOYEE_ID_MAX = 20;
/** 한 세션 명단 상한. 추첨 UI(슬롯 롤링)와 RTDB write 크기를 함께 고려한 실용 한계. */
export const ROSTER_MAX_ROWS = 500;

/** 명시적 구분자 — 엑셀 탭 복사, CSV, 세미콜론. */
const EXPLICIT_SEPARATOR = /[\t,;]/;

/** 사번으로 볼 수 있는 형태(숫자/영문/하이픈). 이름·사번 순서를 뒤집어 붙여넣어도 알아보게 한다. */
const ID_LIKE = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

function splitLine(line) {
  const explicit = line.split(EXPLICIT_SEPARATOR);
  if (explicit.length > 1) return explicit.map((cell) => cell.trim());
  // 구분자가 없으면 공백으로 나눈다. "홍길동 12345" 같은 한 줄 입력용.
  return line.split(/\s+/).map((cell) => cell.trim());
}

/**
 * 한 줄 → { name, employeeId }.
 * 칸이 하나뿐이면 생김새로 판단한다 — 숫자/영문뿐이면 사번, 아니면 이름.
 */
function parseLine(line) {
  const cells = splitLine(line).filter(Boolean);
  if (cells.length === 0) return null;

  if (cells.length === 1) {
    const only = cells[0];
    return ID_LIKE.test(only) ? { name: '', employeeId: only } : { name: only, employeeId: '' };
  }

  let [name, employeeId] = cells;
  // 사번이 앞, 이름이 뒤인 명단도 흔하다. 앞칸만 사번 형태면 뒤집는다.
  if (ID_LIKE.test(name) && !ID_LIKE.test(employeeId)) [name, employeeId] = [employeeId, name];

  return { name, employeeId };
}

/**
 * 붙여넣은 텍스트를 명단 행으로 변환한다.
 * @param {string} text
 * @returns {Array<{name: string, employeeId: string}>} 상한(ROSTER_MAX_ROWS)까지만
 */
export function parseRosterText(text) {
  if (typeof text !== 'string' || !text.trim()) return [];

  const rows = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const parsed = parseLine(line);
    if (!parsed) continue;
    rows.push({
      name: parsed.name.slice(0, ROSTER_NAME_MAX),
      employeeId: parsed.employeeId.slice(0, ROSTER_EMPLOYEE_ID_MAX),
    });
    if (rows.length >= ROSTER_MAX_ROWS) break;
  }
  return rows;
}

/**
 * 저장 직전 정리 — 빈 행 제거 + 사번 중복 제거(먼저 온 행 유지).
 * 중복 사번은 한 사람이 두 번 뽑히는 것으로 보이므로 저장 전에 걸러야 한다.
 *
 * @param {Array<{id?: string, name: string, employeeId: string}>} rows
 * @returns {{ rows: Array, duplicates: string[] }} duplicates는 사용자에게 알릴 중복 사번
 */
export function normalizeRosterRows(rows) {
  const seen = new Set();
  const duplicates = [];
  const clean = [];

  for (const row of rows || []) {
    const name = (row.name || '').trim().slice(0, ROSTER_NAME_MAX);
    const employeeId = (row.employeeId || '').trim().slice(0, ROSTER_EMPLOYEE_ID_MAX);
    if (!name && !employeeId) continue; // 빈 행 — 입력 중이던 흔적

    if (employeeId) {
      if (seen.has(employeeId)) {
        if (!duplicates.includes(employeeId)) duplicates.push(employeeId);
        continue;
      }
      seen.add(employeeId);
    }
    clean.push({ ...(row.id ? { id: row.id } : {}), name, employeeId });
  }

  return { rows: clean, duplicates };
}

/**
 * 추첨/명단에 표시할 이름. 이름이 없으면 사번이 곧 이름이다.
 * nickname은 rules상 10자 제한이라 긴 사번은 잘리지만, employeeId 필드에는 원본이 남는다.
 */
export function rosterDisplayName(row) {
  const name = (row?.name || '').trim();
  if (name) return name.slice(0, ROSTER_NAME_MAX);
  return (row?.employeeId || '').trim().slice(0, ROSTER_NAME_MAX);
}

/**
 * 강사가 직접 입력한 명단임을 나타내는 표식.
 *
 * 추첨 전용 세션의 명단은 입장한 참여자와 같은 노드(participants)에 저장한다 —
 * 그래야 추첨기·명단 표시·엑셀 내보내기가 분기 없이 그대로 동작한다.
 * 대신 이 값으로 "입장한 사람"과 "강사가 넣은 명단"을 구분할 수 있게 남긴다.
 */
export const ROSTER_SOURCE = 'manual';

/**
 * participants 객체 → 편집용 명단 행. 강사가 입력한 항목만, 입력 순서대로.
 *
 * nickname과 employeeId가 같으면 이름 없이 사번만 넣은 행이다(rosterDisplayName의 역변환).
 * 그대로 두면 편집 화면에서 이름 칸에 사번이 복사돼 보이므로 이름을 비운다.
 */
export function selectRosterRows(participants) {
  return Object.entries(participants || {})
    .filter(([, data]) => data?.source === ROSTER_SOURCE)
    .sort((a, b) => (a[1].order || 0) - (b[1].order || 0))
    .map(([id, data]) => ({
      id,
      name: data.nickname === data.employeeId ? '' : (data.nickname || ''),
      employeeId: data.employeeId || '',
    }));
}
