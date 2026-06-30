import { test } from '@playwright/test';
import { testSessionId, cleanupTestSession, firebaseSet, waitForSync } from './helpers';

/**
 * 전자칠판(/live) 전 모드/viz 전수 — 스크롤 발생·세로 중앙정렬 깨짐·오버플로우 점검.
 * 1920×1080 기준. 각 캡처에서 (1) 불필요한 스크롤 (2) 상하 중앙 정렬 (3) 레이아웃 이상 확인.
 */

const OUT = 'test-results/responsive-allmodes';

// 다양한 viz 유형 + 오버플로우 케이스(선택지 8개, 단어 多, Q&A 多)
const QUESTIONS = {
  v_choice4: { title: '좋아하는 언어는?', type: 'choice', options: ['JavaScript', 'Python', 'TypeScript', 'Go'], order: 0 },
  v_choice8: { title: '선택지 많은 객관식 (오버플로우 점검)', type: 'choice', options: ['옵션 A','옵션 B','옵션 C','옵션 D','옵션 E','옵션 F','옵션 G','옵션 H'], order: 1 },
  v_ox: { title: '이해되셨나요?', type: 'ox', options: ['O', 'X'], order: 2 },
  v_quiz: { title: '한국의 수도는?', type: 'quiz', options: ['서울', '부산', '인천', '대구'], correctAnswer: '서울', order: 3 },
  v_wordcloud: { title: '오늘 수업 한 단어로?', type: 'wordcloud', options: [], order: 4 },
  v_subjective: { title: '느낀 점을 적어주세요', type: 'subjective', order: 5 },
  v_scale: { title: '만족도는?', type: 'scale', order: 6 },
  v_debate: { title: '재택근무 찬반?', type: 'debate', options: ['찬성', '반대'], order: 7 },
  v_ranking: { title: '우선순위 순서대로', type: 'ranking', options: ['속도', '품질', '비용', '디자인'], order: 8 },
  v_fill: { title: 'React는 ___ 라이브러리다', type: 'fillinblank', correctAnswer: 'UI', order: 9 },
  v_check: { title: '실습 완료 체크', type: 'check', order: 10 },
  v_mystery: { title: '미스터리 박스 정답은?', type: 'mysteryBox', winners: [], order: 11 },
  v_hint: { title: '힌트 퀴즈', type: 'hintQuiz', hints: ['포유류', '줄무늬'], revealedHints: 1, order: 12 },
};

async function setup(sid) {
  await firebaseSet(`sessions/${sid}`, {
    status: 'active', currentMode: 'poll', currentQuestion: null,
    courseName: '전자칠판 점검', roundNumber: 1, createdAt: Date.now(), questions: QUESTIONS,
  });
  // 참여자/점수 시드 (모드용)
  const parts = {}, scores = {};
  for (let i = 0; i < 30; i++) { parts[`p${i}`] = { nickname: `학생${i + 1}`, online: true }; scores[`p${i}`] = { nickname: `학생${i + 1}`, total: 400 - i * 12 }; }
  await firebaseSet(`sessions/${sid}/participants`, parts);
  await firebaseSet(`sessions/${sid}/scores`, scores);
}

async function seedVotes(sid, qid, values) {
  const votes = {}; values.forEach((v, i) => { votes[`vp${i}`] = { value: v }; });
  await firebaseSet(`sessions/${sid}/questions/${qid}/votes`, votes);
}

async function shoot(page, sid, label, { mode, qid } = {}) {
  if (qid !== undefined) { await firebaseSet(`sessions/${sid}/currentMode`, mode || 'poll'); await firebaseSet(`sessions/${sid}/currentQuestion`, qid); await firebaseSet(`sessions/${sid}/questions/${qid}/activatedAt`, Date.now()); }
  else if (mode) { await firebaseSet(`sessions/${sid}/currentMode`, mode); await firebaseSet(`sessions/${sid}/currentQuestion`, null); }
  await page.goto(`/live?s=${sid}`);
  await page.getByText('불러오는 중').waitFor({ state: 'detached', timeout: 15000 }).catch(() => {});
  await waitForSync(page, 2200);
  // 문서가 뷰포트보다 길어 스크롤 발생하는지 기록
  const scrollInfo = await page.evaluate(() => {
    const el = document.scrollingElement || document.documentElement;
    const overflowing = [...document.querySelectorAll('*')].filter(n => n.scrollHeight > n.clientHeight + 4 && getComputedStyle(n).overflowY !== 'visible' && n.clientHeight > 200).length;
    return { docScroll: el.scrollHeight - el.clientHeight, overflowingPanels: overflowing };
  });
  await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: false });
  return scrollInfo;
}

test('전자칠판 — 전 viz 유형 + 오버플로우', async ({ page }) => {
  test.setTimeout(240_000);
  const sid = testSessionId();
  await setup(sid);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await seedVotes(sid, 'v_choice4', ['JavaScript','JavaScript','Python','Go','Go','Go']);
  await seedVotes(sid, 'v_choice8', ['옵션 A','옵션 B','옵션 C','옵션 D','옵션 E','옵션 F','옵션 G','옵션 H','옵션 A','옵션 C']);
  await seedVotes(sid, 'v_ox', ['O','O','O','X','X']);
  await seedVotes(sid, 'v_quiz', ['서울','서울','부산','인천']);
  await seedVotes(sid, 'v_wordcloud', ['실습','실습','협업','발표','피드백','코딩','재미','실습','협업','집중','복습','이해','应用','네트워킹','성장']);
  await seedVotes(sid, 'v_ranking', ['0,1,2,3','1,0,2,3','0,2,1,3']);

  const report = {};
  const vizList = ['v_choice4','v_choice8','v_ox','v_quiz','v_wordcloud','v_subjective','v_scale','v_debate','v_ranking','v_fill','v_check','v_mystery','v_hint'];
  for (const qid of vizList) {
    const mode = QUESTIONS[qid].type === 'quiz' ? 'quiz' : 'poll';
    report[qid] = await shoot(page, sid, `viz-${qid.replace('v_','')}`, { mode, qid });
  }
  // 특수 모드
  const modes = ['joinShow','qaRanking','randomPicker','focus','combinedRanking','comprehension','discussion','breakTime','leaderboard'];
  for (const m of modes) report[m] = await shoot(page, sid, `mode-${m}`, { mode: m });

  // qaBoard — Q&A 많은 경우(오버플로우)
  const cq = {};
  for (let i = 0; i < 12; i++) cq[`q${i}`] = { text: `학생 질문 ${i + 1}: 이 부분이 잘 이해가 안 됩니다 어떻게 하나요?`, nickname: `학생${i + 1}`, timestamp: Date.now() - i * 1000, answered: false, upvotes: { [`u${i}`]: true } };
  await firebaseSet(`sessions/${sid}/classQuestions`, cq);
  report['qaBoard'] = await shoot(page, sid, 'mode-qaBoard-many', { mode: 'qaBoard' });

  // 스크롤/오버플로우 리포트 출력
  console.log('SCROLL_REPORT ' + JSON.stringify(report));
  await cleanupTestSession(sid);
});
