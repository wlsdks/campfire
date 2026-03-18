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
