/**
 * 배포자 강의(바이브코딩 수업) 시드 예시 — DB 초기화 + 세션 생성.
 * fork 사용자는 이 스크립트를 본인 강의에 맞게 복사해서 수정하세요.
 *
 * Run: node --env-file=.env scripts/seed-vibe-class.mjs
 *
 * 1) 기존 sessions, courseTemplates, questionLibrary 전체 삭제 (주의)
 * 2) "바이브코딩으로 나만의 서비스 만들기" 1차 세션 생성
 */

const DB_URL = process.env.VITE_FIREBASE_DATABASE_URL;
if (!DB_URL) {
  console.error('VITE_FIREBASE_DATABASE_URL 누락 — `node --env-file=.env scripts/seed-vibe-class.mjs` 형태로 실행하세요.');
  process.exit(1);
}

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

// ═══════════════════════════════════════════════════
// 퀴즈 1: 아이스브레이킹 — 오늘 주제 감잡기 (2문항)
// ═══════════════════════════════════════════════════

addQuestion({
  title: '"바이브코딩(Vibe Coding)"이라는 용어를 처음 사용한 사람은?',
  type: 'quiz',
  options: ['일론 머스크', '샘 알트만', '안드레이 카파시', '빌 게이츠'],
  correctAnswer: '안드레이 카파시',
  timer: 15,
});

addQuestion({
  title: '바이브코딩의 핵심은?',
  type: 'quiz',
  options: [
    '코드를 직접 타이핑하는 것',
    '자연어로 AI에게 설명하면 코드가 만들어지는 것',
    '디자인 툴로 화면을 그리는 것',
    '기존 코드를 복사하는 것',
  ],
  correctAnswer: '자연어로 AI에게 설명하면 코드가 만들어지는 것',
  timer: 15,
});

// ═══════════════════════════════════════════════════
// 세팅 완료 체크
// ═══════════════════════════════════════════════════

addQuestion({
  title: '세팅 완료 체크 — Claude Desktop 앱 열고, 로그인하고, Code 모드 선택까지 완료되면 체크해주세요',
  type: 'check',
});

// ═══════════════════════════════════════════════════
// 퀴즈 2: 바이브코딩 개념 확인 (2문항)
// ═══════════════════════════════════════════════════

addQuestion({
  title: '바이브코딩으로 만들 수 없는 것은?',
  type: 'quiz',
  options: ['웹사이트', '앱', '자동화 도구', '남자/여자 친구'],
  correctAnswer: '남자/여자 친구',
  timer: 15,
});

addQuestion({
  title: '바이브코딩을 하려면 가장 먼저 필요한 것은?',
  type: 'quiz',
  options: ['코딩 실력', 'AI 도구', '영어 실력', '개발 경력'],
  correctAnswer: 'AI 도구',
  timer: 15,
});

// ═══════════════════════════════════════════════════
// Part 1 실습 (실습 1~3: 말로만 만들어보기)
// ═══════════════════════════════════════════════════

addQuestion({
  title: '실습 1 완료 체크 — 나만의 디지털 명함 웹페이지를 만들어보셨으면 체크해주세요',
  type: 'check',
});

addQuestion({
  title: '실습 2 완료 체크 — 우리 팀 칭찬 생성기를 만들어보셨으면 체크해주세요',
  type: 'check',
});

addQuestion({
  title: '실습 3 완료 체크 — 나의 MBTI 동물 뽑기를 만들어보셨으면 체크해주세요',
  type: 'check',
});

// ═══════════════════════════════════════════════════
// 퀴즈 3: 바이브코딩의 가치 (1문항)
// ═══════════════════════════════════════════════════

addQuestion({
  title: '다음 중 바이브코딩이 가장 빛나는 순간은?',
  type: 'quiz',
  options: [
    '코드를 직접 짤 때',
    '아이디어를 빠르게 현실로 만들 때',
    '개발자한테 맡길 때',
    '기획서 쓸 때',
  ],
  correctAnswer: '아이디어를 빠르게 현실로 만들 때',
  timer: 15,
});

// ═══════════════════════════════════════════════════
// Part 1 실습 (실습 4~8: 데이터 활용)
// ═══════════════════════════════════════════════════

addQuestion({
  title: '실습 4 완료 체크 — 포케지수 대시보드를 만들어보셨으면 체크해주세요',
  type: 'check',
});

addQuestion({
  title: '실습 5 완료 체크 — 대시보드에 팀별 필터/랭킹 기능을 추가해보셨으면 체크해주세요',
  type: 'check',
});

addQuestion({
  title: '실습 6 완료 체크 — 클로드랑 문답하며 대시보드를 개선해보셨으면 체크해주세요',
  type: 'check',
});

addQuestion({
  title: '실습 7 완료 체크 — 날것 데이터 vs 정돈된 데이터 비교를 해보셨으면 체크해주세요',
  type: 'check',
});

addQuestion({
  title: '실습 8 완료 체크 — 프로젝트 진행률 체커를 만들어보셨으면 체크해주세요',
  type: 'check',
});

// ═══════════════════════════════════════════════════
// 퀴즈 4: Part 1 마무리 (3문항)
// ═══════════════════════════════════════════════════

addQuestion({
  title: '바이브코딩과 챗봇의 가장 큰 차이는?',
  type: 'quiz',
  options: [
    '사용하는 AI가 다르다',
    '대화로 끝나느냐, 결과물이 생기느냐',
    '영어로 써야 한다',
    '코딩 실력이 필요하다',
  ],
  correctAnswer: '대화로 끝나느냐, 결과물이 생기느냐',
  timer: 15,
});

addQuestion({
  title: 'AI에게 더 좋은 결과물을 받으려면?',
  type: 'quiz',
  options: [
    '짧게 한 줄로 요청한다',
    '영어로 요청한다',
    '궁금한 건 AI한테 질문하게 유도한다',
    '여러 번 새로 시작한다',
  ],
  correctAnswer: '궁금한 건 AI한테 질문하게 유도한다',
  timer: 15,
});

addQuestion({
  title: '데이터 품질이 중요한 이유는?',
  type: 'quiz',
  options: [
    'AI가 한글을 못 읽어서',
    '데이터가 정돈될수록 AI 결과물도 정확해져서',
    '날것 데이터는 업로드가 안 돼서',
    '파일 크기가 커서',
  ],
  correctAnswer: '데이터가 정돈될수록 AI 결과물도 정확해져서',
  timer: 15,
});

// ═══════════════════════════════════════════════════
// Part 2 실습 (기획 → 바이브코딩 → 평가)
// ═══════════════════════════════════════════════════

addQuestion({
  title: '실습 1단계 완료 체크 — PRD 작성 완료되셨으면 체크해주세요 (AI와 대화하며 배경/문제/기능 정의)',
  type: 'check',
});

addQuestion({
  title: '실습 2단계 완료 체크 — 나만의 문제를 정의하고 PRD를 만들어보셨으면 체크해주세요',
  type: 'check',
});

addQuestion({
  title: '실습 3단계 완료 체크 — AI 평가 & 개선점 찾기까지 완료되셨으면 체크해주세요',
  type: 'check',
});

// ═══════════════════════════════════════════════════
// 세션 데이터
// ═══════════════════════════════════════════════════

const sessionData = {
  status: 'setting',
  currentQuestion: null,
  currentMode: 'waiting',
  createdAt: Date.now(),
  courseName: '바이브코딩으로 나만의 서비스 만들기',
  roundNumber: 1,
  questions,
};

// ═══════════════════════════════════════════════════
// 실행
// ═══════════════════════════════════════════════════

async function fbDelete(path) {
  const res = await fetch(`${DB_URL}/${path}.json`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE ${path} 실패: ${await res.text()}`);
}

async function fbGet(path) {
  const res = await fetch(`${DB_URL}/${path}.json?shallow=true`);
  if (!res.ok) return null;
  return res.json();
}

async function fbPut(path, data) {
  const res = await fetch(`${DB_URL}/${path}.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PUT ${path} 실패: ${await res.text()}`);
}

async function deleteAllChildren(parentPath) {
  const keys = await fbGet(parentPath);
  if (!keys) return 0;
  const ids = Object.keys(keys);
  await Promise.all(ids.map((id) => fbDelete(`${parentPath}/${id}`)));
  return ids.length;
}

async function seed() {
  console.log('═══ 놀뭐클 바이브코딩 세션 세팅 ═══\n');

  // 1) 기존 데이터 삭제 (개별 키 단위)
  console.log('1) 기존 데이터 삭제 중...');
  const [sDel, cDel, qDel] = await Promise.all([
    deleteAllChildren('sessions'),
    deleteAllChildren('courseTemplates'),
    deleteAllChildren('questionLibrary'),
  ]);
  console.log(`   sessions(${sDel}), courseTemplates(${cDel}), questionLibrary(${qDel}) 삭제 완료\n`);

  // 2) 새 세션 생성
  console.log(`2) 세션 생성: ${sessionId}`);
  console.log(`   강의: ${sessionData.courseName}`);
  console.log(`   문항: ${Object.keys(questions).length}개\n`);

  Object.entries(questions).forEach(([, q]) => {
    console.log(`   ${q.order}. [${q.type}] ${q.title}`);
    if (q.correctAnswer) console.log(`      → 정답: ${q.correctAnswer}`);
  });

  await fbPut(`sessions/${sessionId}`, sessionData);

  const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5173';
  console.log('\n저장 완료!\n');
  console.log(`학생 URL: ${baseUrl}/?s=${sessionId}`);
  console.log(`관리자:   ${baseUrl}/admin?s=${sessionId}`);
}

seed().catch((err) => {
  console.error('오류:', err.message);
  process.exit(1);
});
