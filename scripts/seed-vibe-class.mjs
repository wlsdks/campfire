/**
 * 놀뭐클 바이브코딩 수업용 세션 생성
 * Run: node scripts/seed-vibe-class.mjs
 *
 * 강의명: 바이브코딩으로 나만의 서비스 만들기
 * 퀴즈/문항: 프레젠테이션 흐름에 맞춘 8개 문항
 */

const DB_URL = 'https://jinan-6c884-default-rtdb.asia-southeast1.firebasedatabase.app';

function uid() { return Math.random().toString(36).slice(2, 10); }
function sid() { return `s_${uid()}`; }
function qid() { return `q_${uid()}`; }

const sessionId = sid();

const questions = {};
let order = 1;

function addQuestion(q) {
  const id = qid();
  questions[id] = { ...q, order: order++ };
}

// ===== 1. 아이스 브레이킹 퀴즈 (p2) =====
addQuestion({
  title: 'ChatGPT 출시 후 100만 사용자 도달까지 걸린 시간은?',
  type: 'quiz',
  options: ['1주일', '5일', '1년', '3개월'],
  correctAnswer: '5일',
  timer: 15,
});

addQuestion({
  title: '2025년 기준 전 세계에서 가장 많이 쓰이는 AI 도구는?',
  type: 'quiz',
  options: ['ChatGPT', 'Claude', 'Copilot', 'Gemini'],
  correctAnswer: 'ChatGPT',
  timer: 15,
});

// ===== 2. 바이브코딩 개념 퀴즈 (p10) =====
addQuestion({
  title: '바이브코딩에서 가장 중요한 것은?',
  type: 'quiz',
  options: ['코딩 실력', '아이디어와 설명 능력', '수학 능력', '디자인 실력'],
  correctAnswer: '아이디어와 설명 능력',
  timer: 15,
});

// ===== 3. OX 퀴즈 — 바이브코딩 실무 활용 (p14) =====
addQuestion({
  title: '바이브코딩으로 만든 서비스는 실제 업무에 쓸 수 없다',
  type: 'ox',
  correctAnswer: 'X',
  timer: 10,
});

// ===== 4. Claude/GPT 관련 퀴즈 (p19) =====
addQuestion({
  title: 'Claude Desktop에서 바이브코딩을 하려면 상단에서 어떤 모드를 선택해야 할까요?',
  type: 'quiz',
  options: ['Chat', 'Code', 'Search', 'Write'],
  correctAnswer: 'Code',
  timer: 15,
});

addQuestion({
  title: 'AI에게 요청할 때 가장 중요한 원칙은?',
  type: 'quiz',
  options: [
    '짧게 요청한다',
    '영어로 요청한다',
    '구체적인 맥락을 준다',
    '한 번에 모든 걸 요청한다',
  ],
  correctAnswer: '구체적인 맥락을 준다',
  timer: 15,
});

// ===== 5. 프롬프트 품질 퀴즈 (p37) =====
addQuestion({
  title: '다음 중 AI에게 가장 좋은 요청은?',
  type: 'quiz',
  options: [
    '이 대시보드 개선해줘',
    '이 대시보드 개선해줘. 궁금한 건 나한테 질문해도 좋아',
    '대시보드 만들어줘',
    '좋은 대시보드 보여줘',
  ],
  correctAnswer: '이 대시보드 개선해줘. 궁금한 건 나한테 질문해도 좋아',
  timer: 20,
});

// ===== 6. 실습 전 마무리 — 감정 온도계 (수업 이해도) =====
addQuestion({
  title: '지금까지 설명한 바이브코딩, 얼마나 이해되셨나요?',
  type: 'scale',
  scaleMin: 1,
  scaleMax: 5,
  scaleMinLabel: '아직 모르겠어요',
  scaleMaxLabel: '완전 이해!',
});

// ===== 세션 데이터 =====
const sessionData = {
  status: 'setting',
  currentQuestion: null,
  currentMode: 'waiting',
  createdAt: Date.now(),
  courseName: '바이브코딩으로 나만의 서비스 만들기',
  roundNumber: 1,
  questions,
};

// ===== Firebase에 저장 =====
async function seed() {
  console.log(`세션 ID: ${sessionId}`);
  console.log(`문항 수: ${Object.keys(questions).length}`);
  console.log('');

  Object.entries(questions).forEach(([id, q]) => {
    console.log(`  ${q.order}. [${q.type}] ${q.title}`);
    if (q.correctAnswer) console.log(`     정답: ${q.correctAnswer}`);
  });

  console.log('');
  console.log('Firebase에 저장 중...');

  const res = await fetch(`${DB_URL}/sessions/${sessionId}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionData),
  });

  if (!res.ok) {
    console.error('저장 실패:', await res.text());
    process.exit(1);
  }

  console.log('저장 완료!');
  console.log('');
  console.log(`접속 URL: https://jinan-6c884.web.app/?s=${sessionId}`);
  console.log(`관리자: https://jinan-6c884.web.app/admin?s=${sessionId}`);
}

seed();
