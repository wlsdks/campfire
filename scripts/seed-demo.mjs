/**
 * Demo data seed script for Pinggo
 * Run: node scripts/seed-demo.mjs
 *
 * Creates 5+ classes with various rounds, statuses, questions, participants, and votes.
 * All questions include correctAnswer.
 */

const DB_URL = 'https://jinan-6c884-default-rtdb.asia-southeast1.firebasedatabase.app';

function uid() {
  return Math.random().toString(36).slice(2, 10);
}
function sid() { return `s_${uid()}`; }
function qid() { return `q_${uid()}`; }
function pid() { return `p_${uid()}`; }

const NICKNAMES = [
  '서연', '도윤', '하윤', '민준', '예준', '지우', '시우', '하준', '서윤',
  '주원', '지아', '지유', '채원', '현우', '수아', '건우', '소윤', '지호',
  '은서', '시현', '윤서', '태윤', '다은', '성민', '유나', '재민', '수빈',
  '준서', '하영', '동현', '민서', '지원', '승우', '나윤', '태현', '예은',
];

function pickNames(count) {
  const shuffled = [...NICKNAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function makeParticipants(names) {
  const participants = {};
  const ids = [];
  for (const name of names) {
    const id = pid();
    ids.push(id);
    participants[id] = {
      nickname: name,
      joinedAt: Date.now() - Math.floor(Math.random() * 3600000),
      online: Math.random() > 0.3,
    };
  }
  return { participants, ids };
}

function makeVotes(participantIds, participants, options, voteRatio = 0.8) {
  const votes = {};
  const votingIds = participantIds.filter(() => Math.random() < voteRatio);
  for (const id of votingIds) {
    const value = options[Math.floor(Math.random() * options.length)];
    votes[id] = { value, nickname: participants[id].nickname };
  }
  return votes;
}

function makeWeightedVotes(participantIds, participants, options, weights, voteRatio = 0.85) {
  const votes = {};
  const votingIds = participantIds.filter(() => Math.random() < voteRatio);
  const cumulative = [];
  let sum = 0;
  for (const w of weights) { sum += w; cumulative.push(sum); }
  for (const id of votingIds) {
    const r = Math.random() * sum;
    const idx = cumulative.findIndex((c) => r < c);
    votes[id] = { value: options[idx], nickname: participants[id].nickname };
  }
  return votes;
}

function makeQuizVotesWithTimestamp(participantIds, participants, options, weights, activatedAt) {
  const votes = {};
  const votingIds = participantIds.filter(() => Math.random() < 0.85);
  const cumulative = [];
  let sum = 0;
  for (const w of weights) { sum += w; cumulative.push(sum); }
  for (const id of votingIds) {
    const r = Math.random() * sum;
    const idx = cumulative.findIndex((c) => r < c);
    votes[id] = {
      value: options[idx],
      nickname: participants[id].nickname,
      timestamp: activatedAt + Math.floor(Math.random() * 25000),
    };
  }
  return votes;
}

// ─── CLASSES ───────────────────────────────────────────

const now = Date.now();
const DAY = 86400000;
const HOUR = 3600000;

const sessions = {};

// ═══════════════════════════════════════════════════════
// CLASS 1: 바이브 코딩 기초편 (3 rounds: ended, ended, active)
// ═══════════════════════════════════════════════════════
{
  // Round 1 — ended
  const names1 = pickNames(12);
  const { participants: p1, ids: ids1 } = makeParticipants(names1);
  const q1a = qid(), q1b = qid(), q1c = qid(), q1d = qid();
  const s1 = sid();
  const t1 = now - 7 * DAY;
  sessions[s1] = {
    status: 'ended', currentQuestion: q1a, currentMode: 'poll',
    createdAt: t1, courseName: '바이브 코딩 기초편', roundNumber: 1,
    participants: p1,
    questions: {
      [q1a]: {
        type: 'choice', title: '가장 자주 사용하는 프로그래밍 언어는?', order: 1,
        options: ['Python', 'JavaScript', 'Java', 'Go'],
        correctAnswer: 'Python',
        votes: makeWeightedVotes(ids1, p1, ['Python', 'JavaScript', 'Java', 'Go'], [5, 3, 1, 1]),
      },
      [q1b]: {
        type: 'quiz', title: 'HTTP 상태코드 404의 의미는?', order: 2,
        options: ['서버 오류', '페이지 없음', '권한 없음', '리다이렉트'],
        correctAnswer: '페이지 없음',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
        activatedAt: t1 + HOUR, revealedAt: t1 + HOUR + 35000, awardedAt: t1 + HOUR + 35000,
        votes: makeQuizVotesWithTimestamp(ids1, p1, ['서버 오류', '페이지 없음', '권한 없음', '리다이렉트'], [1, 6, 2, 1], t1 + HOUR),
      },
      [q1c]: {
        type: 'ox', title: 'JavaScript는 인터프리터 언어이다', order: 3,
        correctAnswer: 'O',
        votes: makeWeightedVotes(ids1, p1, ['O', 'X'], [8, 2]),
      },
      [q1d]: {
        type: 'wordcloud', title: '코딩할 때 가장 중요한 것은?', order: 4,
        votes: makeVotes(ids1, p1, ['가독성', '성능', '유지보수', '테스트', '설계', '협업', '문서화', '가독성', '설계']),
      },
    },
  };

  // Round 2 — ended
  const names2 = pickNames(15);
  const { participants: p2, ids: ids2 } = makeParticipants(names2);
  const q2a = qid(), q2b = qid(), q2c = qid(), q2d = qid();
  const s2 = sid();
  const t2 = now - 4 * DAY;
  sessions[s2] = {
    status: 'ended', currentQuestion: q2a, currentMode: 'poll',
    createdAt: t2, courseName: '바이브 코딩 기초편', roundNumber: 2,
    participants: p2,
    questions: {
      [q2a]: {
        type: 'choice', title: 'AI 도구 중 가장 많이 사용하는 것은?', order: 1,
        options: ['ChatGPT', 'Claude', 'Gemini', 'Copilot'],
        correctAnswer: 'Claude',
        votes: makeWeightedVotes(ids2, p2, ['ChatGPT', 'Claude', 'Gemini', 'Copilot'], [3, 6, 2, 2]),
      },
      [q2b]: {
        type: 'quiz', title: 'LLM의 약자는?', order: 2,
        options: ['Large Language Model', 'Long Learning Machine', 'Linear Logic Module'],
        correctAnswer: 'Large Language Model',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
        activatedAt: t2 + HOUR, revealedAt: t2 + HOUR + 40000, awardedAt: t2 + HOUR + 40000,
        votes: makeQuizVotesWithTimestamp(ids2, p2, ['Large Language Model', 'Long Learning Machine', 'Linear Logic Module'], [7, 2, 3], t2 + HOUR),
      },
      [q2c]: {
        type: 'ox', title: 'Python은 컴파일 언어이다', order: 3,
        correctAnswer: 'X',
        votes: makeWeightedVotes(ids2, p2, ['O', 'X'], [3, 9]),
      },
      [q2d]: {
        type: 'qna', title: '수업에서 궁금한 점이 있나요?', order: 4,
        votes: {},
      },
    },
  };

  // Round 3 — active (진행 중)
  const names3 = pickNames(18);
  const { participants: p3, ids: ids3 } = makeParticipants(names3);
  const q3a = qid(), q3b = qid(), q3c = qid();
  const s3 = sid();
  const t3 = now - 2 * HOUR;
  sessions[s3] = {
    status: 'active', currentQuestion: q3a, currentMode: 'poll',
    createdAt: t3, courseName: '바이브 코딩 기초편', roundNumber: 3,
    participants: p3,
    questions: {
      [q3a]: {
        type: 'choice', title: '오늘 수업 난이도는 어땠나요?', order: 1,
        options: ['쉬웠다', '적당했다', '어려웠다', '매우 어려웠다'],
        correctAnswer: '적당했다',
        votes: makeWeightedVotes(ids3, p3, ['쉬웠다', '적당했다', '어려웠다', '매우 어려웠다'], [2, 8, 4, 1]),
      },
      [q3b]: {
        type: 'quiz', title: 'REST API에서 데이터를 생성할 때 사용하는 HTTP 메서드는?', order: 2,
        options: ['GET', 'POST', 'PUT', 'DELETE'],
        correctAnswer: 'POST',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
        activatedAt: t3 + 1800000,
        votes: makeQuizVotesWithTimestamp(ids3, p3, ['GET', 'POST', 'PUT', 'DELETE'], [1, 8, 3, 1], t3 + 1800000),
      },
      [q3c]: {
        type: 'ox', title: 'CSS Flexbox에서 기본 방향은 row이다', order: 3,
        correctAnswer: 'O',
        votes: makeWeightedVotes(ids3, p3, ['O', 'X'], [10, 3]),
      },
    },
  };
}

// ═══════════════════════════════════════════════════════
// CLASS 2: 바이브 코딩 중급편 (2 rounds: ended, active)
// ═══════════════════════════════════════════════════════
{
  const names1 = pickNames(20);
  const { participants: p1, ids: ids1 } = makeParticipants(names1);
  const q1a = qid(), q1b = qid(), q1c = qid(), q1d = qid();
  const s1 = sid();
  const t1 = now - 5 * DAY;
  sessions[s1] = {
    status: 'ended', currentQuestion: q1a, currentMode: 'poll',
    createdAt: t1, courseName: '바이브 코딩 중급편', roundNumber: 1,
    participants: p1,
    questions: {
      [q1a]: {
        type: 'choice', title: '선호하는 상태관리 라이브러리는?', order: 1,
        options: ['Redux', 'Zustand', 'Recoil', 'Jotai', 'Context API'],
        correctAnswer: 'Zustand',
        votes: makeWeightedVotes(ids1, p1, ['Redux', 'Zustand', 'Recoil', 'Jotai', 'Context API'], [3, 7, 2, 4, 3]),
      },
      [q1b]: {
        type: 'quiz', title: 'React에서 side effect를 처리하는 훅은?', order: 2,
        options: ['useState', 'useEffect', 'useMemo', 'useRef'],
        correctAnswer: 'useEffect',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
        activatedAt: t1 + HOUR, revealedAt: t1 + HOUR + 30000, awardedAt: t1 + HOUR + 30000,
        votes: makeQuizVotesWithTimestamp(ids1, p1, ['useState', 'useEffect', 'useMemo', 'useRef'], [1, 12, 3, 2], t1 + HOUR),
      },
      [q1c]: {
        type: 'ox', title: 'useEffect의 빈 의존성 배열은 마운트 시 1회만 실행된다', order: 3,
        correctAnswer: 'O',
        votes: makeWeightedVotes(ids1, p1, ['O', 'X'], [14, 4]),
      },
      [q1d]: {
        type: 'wordcloud', title: 'React에서 가장 어려운 개념은?', order: 4,
        votes: makeVotes(ids1, p1, ['상태관리', 'useEffect', '렌더링', '라이프사이클', '비동기', 'Hooks', '상태관리', 'useEffect', '렌더링']),
      },
    },
  };

  // Round 2 — active
  const names2 = pickNames(16);
  const { participants: p2, ids: ids2 } = makeParticipants(names2);
  const q2a = qid(), q2b = qid(), q2c = qid(), q2d = qid();
  const s2 = sid();
  const t2 = now - 3 * HOUR;
  sessions[s2] = {
    status: 'active', currentQuestion: q2b, currentMode: 'quiz',
    createdAt: t2, courseName: '바이브 코딩 중급편', roundNumber: 2,
    participants: p2,
    questions: {
      [q2a]: {
        type: 'choice', title: '가장 좋아하는 CSS 프레임워크는?', order: 1,
        options: ['Tailwind CSS', 'Bootstrap', 'styled-components', 'Vanilla CSS'],
        correctAnswer: 'Tailwind CSS',
        votes: makeWeightedVotes(ids2, p2, ['Tailwind CSS', 'Bootstrap', 'styled-components', 'Vanilla CSS'], [8, 2, 3, 2]),
      },
      [q2b]: {
        type: 'quiz', title: 'Tailwind CSS에서 flex 컨테이너를 만드는 클래스는?', order: 2,
        options: ['display-flex', 'flex', 'd-flex', 'flexbox'],
        correctAnswer: 'flex',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
        activatedAt: t2 + HOUR,
        votes: makeQuizVotesWithTimestamp(ids2, p2, ['display-flex', 'flex', 'd-flex', 'flexbox'], [1, 10, 2, 1], t2 + HOUR),
      },
      [q2c]: {
        type: 'ox', title: 'Tailwind CSS는 utility-first 프레임워크이다', order: 3,
        correctAnswer: 'O',
      },
      [q2d]: {
        type: 'wordcloud', title: 'Tailwind의 장점 하나만 말해주세요', order: 4,
      },
    },
  };
}

// ═══════════════════════════════════════════════════════
// CLASS 3: AI 프롬프트 엔지니어링 (2 rounds: ended, setting)
// ═══════════════════════════════════════════════════════
{
  const names1 = pickNames(22);
  const { participants: p1, ids: ids1 } = makeParticipants(names1);
  const q1a = qid(), q1b = qid(), q1c = qid(), q1d = qid(), q1e = qid();
  const s1 = sid();
  const t1 = now - 10 * DAY;
  sessions[s1] = {
    status: 'ended', currentQuestion: q1a, currentMode: 'poll',
    createdAt: t1, courseName: 'AI 프롬프트 엔지니어링', roundNumber: 1,
    participants: p1,
    questions: {
      [q1a]: {
        type: 'choice', title: '프롬프트 작성 시 가장 중요한 요소는?', order: 1,
        options: ['명확한 지시', '예시 제공', '역할 지정', '출력 형식 지정'],
        correctAnswer: '명확한 지시',
        votes: makeWeightedVotes(ids1, p1, ['명확한 지시', '예시 제공', '역할 지정', '출력 형식 지정'], [8, 4, 5, 3]),
      },
      [q1b]: {
        type: 'quiz', title: 'Few-shot 프롬프팅에서 "shot"의 의미는?', order: 2,
        options: ['시도 횟수', '예시 개수', '모델 크기', '토큰 수'],
        correctAnswer: '예시 개수',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
        activatedAt: t1 + HOUR, revealedAt: t1 + HOUR + 32000, awardedAt: t1 + HOUR + 32000,
        votes: makeQuizVotesWithTimestamp(ids1, p1, ['시도 횟수', '예시 개수', '모델 크기', '토큰 수'], [3, 10, 4, 2], t1 + HOUR),
      },
      [q1c]: {
        type: 'ox', title: 'Chain of Thought 프롬프팅은 추론 능력을 향상시킨다', order: 3,
        correctAnswer: 'O',
        votes: makeWeightedVotes(ids1, p1, ['O', 'X'], [16, 4]),
      },
      [q1d]: {
        type: 'quiz', title: 'Temperature 값이 0에 가까우면 출력은?', order: 4,
        options: ['더 창의적', '더 결정적', '더 긴 출력', '더 짧은 출력'],
        correctAnswer: '더 결정적',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
        activatedAt: t1 + 2 * HOUR, revealedAt: t1 + 2 * HOUR + 28000, awardedAt: t1 + 2 * HOUR + 28000,
        votes: makeQuizVotesWithTimestamp(ids1, p1, ['더 창의적', '더 결정적', '더 긴 출력', '더 짧은 출력'], [4, 12, 2, 1], t1 + 2 * HOUR),
      },
      [q1e]: {
        type: 'wordcloud', title: 'AI 시대에 가장 중요한 역량은?', order: 5,
        votes: makeVotes(ids1, p1, ['비판적 사고', '창의성', '소통', '프롬프팅', '데이터 분석', '적응력', '비판적 사고', '창의성']),
      },
    },
  };

  // Round 2 — setting
  const s2 = sid();
  sessions[s2] = {
    status: 'setting', currentQuestion: null, currentMode: 'waiting',
    createdAt: now - 1 * DAY, courseName: 'AI 프롬프트 엔지니어링', roundNumber: 2,
    questions: {
      [qid()]: {
        type: 'choice', title: '가장 효과적인 프롬프트 기법은?', order: 1,
        options: ['Zero-shot', 'Few-shot', 'Chain of Thought', 'Tree of Thought'],
        correctAnswer: 'Chain of Thought',
      },
      [qid()]: {
        type: 'quiz', title: 'System 프롬프트의 주요 목적은?', order: 2,
        options: ['속도 향상', '모델의 역할/행동 정의', '토큰 절약', '비용 절감'],
        correctAnswer: '모델의 역할/행동 정의',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
      },
      [qid()]: {
        type: 'ox', title: 'Hallucination은 AI가 사실이 아닌 내용을 생성하는 현상이다', order: 3,
        correctAnswer: 'O',
      },
    },
  };
}

// ═══════════════════════════════════════════════════════
// CLASS 4: 데이터 분석 입문 (4 rounds: ended x3, setting x1)
// ═══════════════════════════════════════════════════════
{
  // Round 1 — ended
  const names1 = pickNames(14);
  const { participants: p1, ids: ids1 } = makeParticipants(names1);
  const s1 = sid();
  const t1 = now - 14 * DAY;
  sessions[s1] = {
    status: 'ended', currentQuestion: null, currentMode: 'waiting',
    createdAt: t1, courseName: '데이터 분석 입문', roundNumber: 1,
    participants: p1,
    questions: {
      [qid()]: {
        type: 'choice', title: '데이터 분석에 가장 많이 사용하는 도구는?', order: 1,
        options: ['Excel', 'Python', 'R', 'SQL'],
        correctAnswer: 'Python',
        votes: makeWeightedVotes(ids1, p1, ['Excel', 'Python', 'R', 'SQL'], [4, 5, 1, 3]),
      },
      [qid()]: {
        type: 'ox', title: '평균은 이상치(Outlier)에 민감하다', order: 2,
        correctAnswer: 'O',
        votes: makeWeightedVotes(ids1, p1, ['O', 'X'], [10, 3]),
      },
      [qid()]: {
        type: 'quiz', title: '상관관계와 인과관계의 차이를 나타내는 표현은?', order: 3,
        options: ['Correlation implies causation', 'Correlation does not imply causation', 'Causation requires correlation'],
        correctAnswer: 'Correlation does not imply causation',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
        activatedAt: t1 + HOUR, revealedAt: t1 + HOUR + 35000, awardedAt: t1 + HOUR + 35000,
        votes: makeQuizVotesWithTimestamp(ids1, p1, ['Correlation implies causation', 'Correlation does not imply causation', 'Causation requires correlation'], [2, 8, 3], t1 + HOUR),
      },
    },
  };

  // Round 2 — ended
  const names2 = pickNames(16);
  const { participants: p2, ids: ids2 } = makeParticipants(names2);
  const s2 = sid();
  const t2 = now - 9 * DAY;
  sessions[s2] = {
    status: 'ended', currentQuestion: null, currentMode: 'waiting',
    createdAt: t2, courseName: '데이터 분석 입문', roundNumber: 2,
    participants: p2,
    questions: {
      [qid()]: {
        type: 'choice', title: '데이터 시각화에 가장 적합한 라이브러리는?', order: 1,
        options: ['Matplotlib', 'Seaborn', 'Plotly', 'D3.js'],
        correctAnswer: 'Plotly',
        votes: makeWeightedVotes(ids2, p2, ['Matplotlib', 'Seaborn', 'Plotly', 'D3.js'], [3, 4, 6, 2]),
      },
      [qid()]: {
        type: 'ox', title: '히스토그램과 바 차트는 같은 차트이다', order: 2,
        correctAnswer: 'X',
        votes: makeWeightedVotes(ids2, p2, ['O', 'X'], [5, 9]),
      },
      [qid()]: {
        type: 'wordcloud', title: '데이터 분석가에게 필요한 역량은?', order: 3,
        votes: makeVotes(ids2, p2, ['통계', 'SQL', 'Python', '시각화', '커뮤니케이션', '도메인 지식', '통계', 'SQL']),
      },
    },
  };

  // Round 3 — ended
  const names3 = pickNames(18);
  const { participants: p3, ids: ids3 } = makeParticipants(names3);
  const s3 = sid();
  const t3 = now - 3 * DAY;
  sessions[s3] = {
    status: 'ended', currentQuestion: null, currentMode: 'waiting',
    createdAt: t3, courseName: '데이터 분석 입문', roundNumber: 3,
    participants: p3,
    questions: {
      [qid()]: {
        type: 'quiz', title: 'pandas에서 DataFrame의 처음 5행을 보는 메서드는?', order: 1,
        options: ['df.first()', 'df.head()', 'df.top()', 'df.show()'],
        correctAnswer: 'df.head()',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
        activatedAt: t3 + HOUR, revealedAt: t3 + HOUR + 25000, awardedAt: t3 + HOUR + 25000,
        votes: makeQuizVotesWithTimestamp(ids3, p3, ['df.first()', 'df.head()', 'df.top()', 'df.show()'], [1, 12, 2, 1], t3 + HOUR),
      },
      [qid()]: {
        type: 'choice', title: '결측치 처리 방법 중 가장 많이 사용하는 것은?', order: 2,
        options: ['삭제', '평균값 대체', '중앙값 대체', '보간법'],
        correctAnswer: '중앙값 대체',
        votes: makeWeightedVotes(ids3, p3, ['삭제', '평균값 대체', '중앙값 대체', '보간법'], [4, 5, 5, 2]),
      },
      [qid()]: {
        type: 'ox', title: 'NULL과 0은 같은 의미이다', order: 3,
        correctAnswer: 'X',
        votes: makeWeightedVotes(ids3, p3, ['O', 'X'], [3, 13]),
      },
    },
  };

  // Round 4 — setting
  const s4 = sid();
  sessions[s4] = {
    status: 'setting', currentQuestion: null, currentMode: 'waiting',
    createdAt: now - 6 * HOUR, courseName: '데이터 분석 입문', roundNumber: 4,
    questions: {
      [qid()]: {
        type: 'choice', title: '머신러닝에서 과적합을 방지하는 방법은?', order: 1,
        options: ['더 많은 데이터', '규제화', '교차 검증', '모두 해당'],
        correctAnswer: '모두 해당',
      },
      [qid()]: {
        type: 'ox', title: '지도학습에서는 라벨이 필요하다', order: 2,
        correctAnswer: 'O',
      },
    },
  };
}

// ═══════════════════════════════════════════════════════
// CLASS 5: UX/UI 디자인 원칙 (2 rounds: ended, active)
// ═══════════════════════════════════════════════════════
{
  const names1 = pickNames(25);
  const { participants: p1, ids: ids1 } = makeParticipants(names1);
  const s1 = sid();
  const t1 = now - 6 * DAY;
  sessions[s1] = {
    status: 'ended', currentQuestion: null, currentMode: 'waiting',
    createdAt: t1, courseName: 'UX/UI 디자인 원칙', roundNumber: 1,
    participants: p1,
    questions: {
      [qid()]: {
        type: 'choice', title: '사용자 경험에서 가장 중요한 원칙은?', order: 1,
        options: ['일관성', '피드백', '단순함', '접근성'],
        correctAnswer: '단순함',
        votes: makeWeightedVotes(ids1, p1, ['일관성', '피드백', '단순함', '접근성'], [5, 4, 10, 3]),
      },
      [qid()]: {
        type: 'quiz', title: 'Nielsen의 10가지 휴리스틱 중 "사용자 제어와 자유"의 예시는?', order: 2,
        options: ['실행 취소 버튼', '로딩 스피너', '브레드크럼', '툴팁'],
        correctAnswer: '실행 취소 버튼',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
        activatedAt: t1 + HOUR, revealedAt: t1 + HOUR + 30000, awardedAt: t1 + HOUR + 30000,
        votes: makeQuizVotesWithTimestamp(ids1, p1, ['실행 취소 버튼', '로딩 스피너', '브레드크럼', '툴팁'], [14, 3, 4, 2], t1 + HOUR),
      },
      [qid()]: {
        type: 'ox', title: 'Fitts의 법칙: 타겟이 클수록 선택이 쉽다', order: 3,
        correctAnswer: 'O',
        votes: makeWeightedVotes(ids1, p1, ['O', 'X'], [18, 5]),
      },
      [qid()]: {
        type: 'wordcloud', title: '좋은 UI의 특징을 한 단어로?', order: 4,
        votes: makeVotes(ids1, p1, ['직관적', '심플', '깔끔', '일관성', '반응형', '아름다운', '직관적', '심플', '깔끔']),
      },
    },
  };

  // Round 2 — active
  const names2 = pickNames(19);
  const { participants: p2, ids: ids2 } = makeParticipants(names2);
  const q2a = qid(), q2b = qid(), q2c = qid();
  const s2 = sid();
  const t2 = now - 1 * HOUR;
  sessions[s2] = {
    status: 'active', currentQuestion: q2a, currentMode: 'poll',
    createdAt: t2, courseName: 'UX/UI 디자인 원칙', roundNumber: 2,
    participants: p2,
    questions: {
      [q2a]: {
        type: 'choice', title: '모바일 UI에서 터치 타겟의 최소 크기는?', order: 1,
        options: ['32px', '44px', '48px', '56px'],
        correctAnswer: '48px',
        votes: makeWeightedVotes(ids2, p2, ['32px', '44px', '48px', '56px'], [1, 6, 8, 3]),
      },
      [q2b]: {
        type: 'quiz', title: '색맹 사용자를 위해 색상만으로 정보를 전달하면 안 되는 이유는?', order: 2,
        options: ['느리다', '비싸다', '구분이 불가능하다', '못 생겼다'],
        correctAnswer: '구분이 불가능하다',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
      },
      [q2c]: {
        type: 'ox', title: '다크모드는 항상 눈의 피로를 줄여준다', order: 3,
        correctAnswer: 'X',
      },
    },
  };
}

// ═══════════════════════════════════════════════════════
// CLASS 6: 클라우드 컴퓨팅 기초 (1 round: setting)
// ═══════════════════════════════════════════════════════
{
  const s1 = sid();
  sessions[s1] = {
    status: 'setting', currentQuestion: null, currentMode: 'waiting',
    createdAt: now - 2 * HOUR, courseName: '클라우드 컴퓨팅 기초', roundNumber: 1,
    questions: {
      [qid()]: {
        type: 'choice', title: '가장 많이 사용하는 클라우드 서비스는?', order: 1,
        options: ['AWS', 'Azure', 'GCP', 'Naver Cloud'],
        correctAnswer: 'AWS',
      },
      [qid()]: {
        type: 'quiz', title: 'IaaS, PaaS, SaaS 중 가장 추상화 수준이 높은 것은?', order: 2,
        options: ['IaaS', 'PaaS', 'SaaS'],
        correctAnswer: 'SaaS',
        points: 100, participationTickets: 1, correctBonusTickets: 2,
        speedWindowMs: 30000, maxSpeedBonus: 50,
      },
      [qid()]: {
        type: 'ox', title: 'Serverless는 서버가 없다는 의미이다', order: 3,
        correctAnswer: 'X',
      },
      [qid()]: {
        type: 'wordcloud', title: '클라우드의 장점은?', order: 4,
      },
    },
  };
}

// ─── WRITE TO FIREBASE ────────────────────────────────

async function seed() {
  // 1. Get existing sessions and delete them one by one
  console.log('🗑️  Clearing existing sessions...');
  const getRes = await fetch(`${DB_URL}/sessions.json`);
  if (getRes.ok) {
    const existing = await getRes.json();
    if (existing) {
      const ids = Object.keys(existing);
      console.log(`   Deleting ${ids.length} existing sessions...`);
      await Promise.all(ids.map((id) =>
        fetch(`${DB_URL}/sessions/${id}.json`, { method: 'DELETE' })
      ));
    }
  }
  console.log('✅ Sessions cleared');

  // 2. Write new sessions individually
  console.log(`📝 Writing ${Object.keys(sessions).length} sessions...`);
  await Promise.all(Object.entries(sessions).map(([id, data]) =>
    fetch(`${DB_URL}/sessions/${id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((res) => {
      if (!res.ok) throw new Error(`Write ${id} failed: ${res.status}`);
    })
  ));
  console.log('✅ Demo data seeded successfully!');

  // Summary
  const courses = {};
  for (const [id, s] of Object.entries(sessions)) {
    const name = s.courseName;
    if (!courses[name]) courses[name] = [];
    courses[name].push({ round: s.roundNumber, status: s.status, id });
  }
  console.log('\n📊 Summary:');
  for (const [name, rounds] of Object.entries(courses)) {
    console.log(`  ${name} (${rounds.length}차수)`);
    for (const r of rounds.sort((a, b) => a.round - b.round)) {
      console.log(`    ${r.round}차 — ${r.status}`);
    }
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
