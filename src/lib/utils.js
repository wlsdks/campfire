/**
 * Generates a short unique ID for a question (e.g. "q_a1b2c3d4").
 * @returns {string} Question ID prefixed with "q_"
 */
export function generateQuestionId() {
  return 'q_' + crypto.randomUUID().slice(0, 8);
}

/**
 * Generates a short unique ID for a session (e.g. "s_a1b2c3d4").
 * @returns {string} Session ID prefixed with "s_"
 */
export function generateSessionId() {
  return 's_' + crypto.randomUUID().slice(0, 8);
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
