export function generateQuestionId() {
  return 'q_' + crypto.randomUUID().slice(0, 8);
}

export function generateSessionId() {
  return 's_' + crypto.randomUUID().slice(0, 8);
}

export function formatPercent(count, total) {
  if (total === 0) return '0%';
  return Math.round((count / total) * 100) + '%';
}
