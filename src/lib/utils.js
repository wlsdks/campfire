/**
 * 사용자 제출 URL을 href에 넣기 전 스킴 검증 — javascript:/data: 등 위험 스킴 차단.
 * http/https만 통과시키고, 그 외(또는 파싱 실패)는 undefined 반환(링크 비활성).
 * @param {string} url
 * @returns {string|undefined}
 */
export function safeHttpUrl(url) {
  if (!url || typeof url !== 'string') return undefined;
  try {
    const p = new URL(url, window.location.origin);
    return (p.protocol === 'http:' || p.protocol === 'https:') ? url : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 정답 비교용 정규화 — 자유 입력형(빈칸/미스터리박스/힌트퀴즈) 답변을 비교하기 전에 적용.
 * 소문자화 + 모든 공백(스페이스·탭·전각공백 U+3000 포함) 제거 → "머신 러닝"과 "머신러닝"을
 * 같은 답으로 인정한다. 대소문자·띄어쓰기 차이만 흡수하며, 오탈자는 그대로 오답 처리.
 * @param {string} s
 * @returns {string}
 */
export function normalizeAnswer(s) {
  return (s || '').toLowerCase().replace(/\s+/g, '');
}

/**
 * Generate a UUID v4 with fallback for older browsers (Safari <15.3, Android).
 * Uses crypto.randomUUID() when available, falls back to crypto.getRandomValues().
 * @returns {string} UUID v4 string
 */
export function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: construct from crypto.getRandomValues (supported in all modern browsers)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 1
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Generates a short unique ID for a question (e.g. "q_a1b2c3d4").
 * @returns {string} Question ID prefixed with "q_"
 */
export function generateQuestionId() {
  return 'q_' + uuid().slice(0, 8);
}

/**
 * Generates a short unique ID for a session (e.g. "s_a1b2c3d4").
 * @returns {string} Session ID prefixed with "s_"
 */
export function generateSessionId() {
  return 's_' + uuid().slice(0, 8);
}

/**
 * Formats a count/total ratio as a rounded percentage string.
 * @param {number} count - The numerator
 * @param {number} total - The denominator
 * @returns {string} Formatted percentage (e.g. "42%"), or "0%" when total is 0
 */
export function formatPercent(count, total) {
  if (total === 0) return '0%';
  return Math.round((count / total) * 100) + '%';
}

/**
 * Converts a timestamp to relative time string (Korean).
 * @param {number} timestamp - Unix timestamp in ms
 * @returns {string} Relative time (e.g. "방금", "3분 전", "2시간 전", "1일 전")
 */
export function timeAgo(timestamp) {
  if (!timestamp) return '';
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

/**
 * Formats a timestamp to Korean AM/PM time string.
 * @param {number} timestamp - Unix timestamp in ms
 * @returns {string} Formatted time (e.g. "오후 3:42")
 */
export function formatChatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h < 12 ? '오전' : '오후';
  return `${period} ${h % 12 || 12}:${m}`;
}
