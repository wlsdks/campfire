export const QUIZ_DEFAULTS = {
  points: 100,
  maxSpeedBonus: 50,
  speedWindowMs: 30000,
  participationTickets: 1,
  correctBonusTickets: 2,
};

export const QUIZ_EVENT_PRESETS = [
  {
    id: 'double-points',
    label: '2배 점수',
    description: '다음 퀴즈의 정답 점수가 2배로 적용됩니다.',
    pointMultiplier: 2,
  },
  {
    id: 'ticket-rush',
    label: '티켓 러시',
    description: '다음 퀴즈의 정답자에게 추가 티켓 2장을 지급합니다.',
    correctBonusTickets: 2,
  },
  {
    id: 'jackpot',
    label: '잭팟 라운드',
    description: '다음 퀴즈에 2배 점수와 추가 티켓 2장을 함께 적용합니다.',
    pointMultiplier: 2,
    correctBonusTickets: 2,
  },
];

const QUIZ_EVENT_MAP = Object.fromEntries(
  QUIZ_EVENT_PRESETS.map((preset) => [preset.id, preset])
);

export function isQuizQuestion(question) {
  return question?.type === 'quiz';
}

export function getQuestionMode(question) {
  if (isQuizQuestion(question)) return 'quiz';
  return 'poll';
}

export function getQuizEventPreset(eventId) {
  return QUIZ_EVENT_MAP[eventId] || null;
}

export function normalizeQuizEvent(event) {
  if (!event) return null;
  if (typeof event === 'string') return getQuizEventPreset(event);

  const preset = event.id ? getQuizEventPreset(event.id) : null;
  return {
    ...(preset || {}),
    ...event,
  };
}

export function getQuizEventBadges(event) {
  const normalized = normalizeQuizEvent(event);
  if (!normalized) return [];

  const badges = [];

  if ((normalized.pointMultiplier || 1) > 1) {
    badges.push(`${normalized.pointMultiplier}배 점수`);
  }

  if ((normalized.correctBonusTickets || 0) > 0) {
    badges.push(`정답 +${normalized.correctBonusTickets} 티켓`);
  }

  if ((normalized.participationBonusTickets || 0) > 0) {
    badges.push(`참여 +${normalized.participationBonusTickets} 티켓`);
  }

  return badges;
}

/**
 * Bet multiplier options for point betting.
 * { multiplier, label, penalty (points lost on wrong answer) }
 */
export const BET_OPTIONS = [
  { multiplier: 1, label: '안전', penalty: 0 },
  { multiplier: 2, label: '자신', penalty: 30 },
  { multiplier: 3, label: '올인', penalty: 60 },
];

export function getQuizReward(question, vote) {
  const isCorrect = vote?.value === question?.correctAnswer;
  const event = normalizeQuizEvent(question?.event);
  const participationTickets = (question?.participationTickets ?? QUIZ_DEFAULTS.participationTickets)
    + (event?.participationBonusTickets || 0);
  const correctBonusTickets = (question?.correctBonusTickets ?? QUIZ_DEFAULTS.correctBonusTickets)
    + (event?.correctBonusTickets || 0);

  // Betting multiplier (1x/2x/3x) — only active when question has betting enabled
  const betEnabled = question?.betting === true;
  const betMultiplier = betEnabled ? (parseInt(vote?.bet, 10) || 1) : 1;
  const betOption = BET_OPTIONS.find((b) => b.multiplier === betMultiplier) || BET_OPTIONS[0];

  if (!isCorrect) {
    return {
      isCorrect: false,
      points: betEnabled ? -betOption.penalty : 0,
      tickets: vote ? participationTickets : 0,
      bet: betMultiplier,
    };
  }

  const activatedAt = typeof question?.activatedAt === 'number' ? question.activatedAt : 0;
  const submittedAt = typeof vote?.timestamp === 'number' ? vote.timestamp : activatedAt;
  const speedWindowMs = question?.speedWindowMs ?? QUIZ_DEFAULTS.speedWindowMs;
  const maxSpeedBonus = question?.maxSpeedBonus ?? QUIZ_DEFAULTS.maxSpeedBonus;
  const basePoints = question?.points ?? QUIZ_DEFAULTS.points;
  const pointMultiplier = event?.pointMultiplier ?? 1;
  const elapsedMs = Math.max(0, submittedAt - activatedAt);
  const speedRatio = Math.max(0, 1 - (elapsedMs / speedWindowMs));
  const totalPoints = basePoints + Math.round(speedRatio * maxSpeedBonus);

  return {
    isCorrect: true,
    points: Math.round(totalPoints * pointMultiplier * betMultiplier),
    tickets: participationTickets + correctBonusTickets,
    bet: betMultiplier,
  };
}
