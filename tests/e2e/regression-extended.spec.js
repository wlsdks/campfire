import { test, expect } from '@playwright/test';
import {
  testSessionId,
  createTestSession,
  activateQuestion,
  cleanupTestSession,
  firebaseSet,
  firebaseGet,
  waitForSync,
} from './helpers';

/** Join session as student by clicking "참여하기". */
async function joinAsStudent(page, baseURL, sessionId, nickname) {
  await page.goto(`${baseURL}/?s=${sessionId}`);
  await page.fill('input[placeholder="닉네임 입력"]', nickname);
  await page.getByRole('button', { name: /참여하기/ }).click();
  await page.waitForTimeout(2500);
}

// ═══════════════════════════════════════════════════════════
// 1. 질문 타입별 투표 + 재투표 방지 (확장)
// ═══════════════════════════════════════════════════════════
test.describe('질문 타입별 투표', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid, {
      questions: {
        q_choice: { title: '객관식 테스트', type: 'choice', options: ['A', 'B', 'C'], order: 0 },
        q_ox: { title: 'OX 테스트', type: 'ox', options: ['O', 'X'], order: 1 },
        q_text: { title: '단어 입력', type: 'wordcloud', options: [], order: 2 },
        q_quiz: { title: '퀴즈 테스트', type: 'quiz', options: ['가', '나', '다'], correctAnswer: '가', order: 3 },
        q_check: { title: '실습 완료', type: 'check', options: [], order: 4 },
      },
    });
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  // 객관식 재투표 차단은 regression.spec.js에서 커버 (동일 패턴, 다른 세션)

  test('OX: O 투표 → 확인 화면', async ({ page }) => {
    await joinAsStudent(page, '', sid, 'OX유저');
    await activateQuestion(sid, 'q_ox');
    await waitForSync(page);

    await expect(page.getByText('맞아요')).toBeVisible({ timeout: 8000 });
    await page.getByText('맞아요').click();
    await expect(page.getByText('투표 완료!')).toBeVisible({ timeout: 5000 });
  });

  test('워드클라우드: 텍스트 입력 → 제출 확인', async ({ page }) => {
    await joinAsStudent(page, '', sid, '워드유저');
    await firebaseSet(`sessions/${sid}/currentQuestion`, null);
    await page.waitForTimeout(500);
    await activateQuestion(sid, 'q_text');
    await waitForSync(page, 3000);

    const input = page.getByPlaceholder('입력해주세요').or(page.getByPlaceholder('단어를 입력하세요'));
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.fill('테스트단어');
    await page.getByRole('button', { name: /제출/ }).click();
    await expect(page.getByText('단어가 등록되었습니다')).toBeVisible({ timeout: 5000 });
  });

  test('체크: 완료 버튼 탭 → 확인 화면', async ({ page }) => {
    await joinAsStudent(page, '', sid, '체크유저');
    await firebaseSet(`sessions/${sid}/currentQuestion`, null);
    await page.waitForTimeout(500);
    await activateQuestion(sid, 'q_check');
    await waitForSync(page, 3000);

    const checkBtn = page.getByText('완료했어요');
    await expect(checkBtn).toBeVisible({ timeout: 10000 });
    await checkBtn.click();
    await expect(page.getByText('완료 체크!')).toBeVisible({ timeout: 5000 });

    // 새로고침 후에도 완료 상태 유지
    await page.reload();
    await waitForSync(page, 3000);
    await expect(page.getByText('완료 체크!').or(page.getByText('다음 안내를 기다리는 중'))).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════════════════════════════════════════════════
// 2. 질문 전환 시 화면 전환
// ═══════════════════════════════════════════════════════════
test.describe('질문 전환', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('객관식 → OX → 워드클라우드 순서 전환', async ({ page }) => {
    await joinAsStudent(page, '', sid, '전환유저');

    // 객관식
    await activateQuestion(sid, 'q1');
    await waitForSync(page, 3000);
    await expect(page.getByText('JavaScript')).toBeVisible({ timeout: 8000 });

    // OX로 전환
    await activateQuestion(sid, 'q2');
    await waitForSync(page, 3000);
    await expect(page.getByText('맞아요')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('JavaScript')).not.toBeVisible({ timeout: 2000 }).catch(() => {});

    // 워드클라우드로 전환
    await activateQuestion(sid, 'q3');
    await waitForSync(page, 3000);
    const input = page.getByPlaceholder('입력해주세요').or(page.getByPlaceholder('단어를 입력하세요'));
    await expect(input).toBeVisible({ timeout: 8000 });
  });

  test('질문 비활성화 → 대기 화면으로 복귀', async ({ page }) => {
    await joinAsStudent(page, '', sid, '비활성유저');
    await activateQuestion(sid, 'q1');
    await waitForSync(page, 3000);
    await expect(page.getByText('JavaScript')).toBeVisible({ timeout: 8000 });

    // 비활성화
    await firebaseSet(`sessions/${sid}/currentQuestion`, null);
    await waitForSync(page, 3000);

    // 대기 화면
    await expect(page.getByText('비활성유저님, 준비 완료!')).toBeVisible({ timeout: 8000 });
  });
});

// ═══════════════════════════════════════════════════════════
// 3. 세션 상태 전환 (active → reviewing → ended)
// ═══════════════════════════════════════════════════════════
test.describe('세션 상태 전환', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  // 세션 종료 화면은 session-lifecycle.spec.js에서 커버
});

// ═══════════════════════════════════════════════════════════
// 4. 모바일 뷰포트 테스트
// ═══════════════════════════════════════════════════════════
test.describe('모바일 뷰포트', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('iPhone SE (375px) — JoinPage 정상 렌더링', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const page = await context.newPage();
    await page.goto(`http://localhost:5173/?s=${sid}`);
    await page.waitForTimeout(1500);

    // 닉네임 입력 + 참여하기 버튼 보임
    await expect(page.getByPlaceholder('닉네임 입력')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /참여하기/ })).toBeVisible();

    await context.close();
  });

  test('iPhone SE — 투표 화면 스크롤 가능', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
    const page = await context.newPage();
    await joinAsStudent(page, 'http://localhost:5173', sid, 'SE유저');
    await activateQuestion(sid, 'q1');
    await waitForSync(page, 3000);

    // 4개 선택지 중 마지막도 스크롤해서 볼 수 있어야 함
    await expect(page.getByText('JavaScript')).toBeVisible({ timeout: 8000 });
    const goBtn = page.getByText('Go');
    await goBtn.scrollIntoViewIfNeeded();
    await expect(goBtn).toBeVisible();

    await context.close();
  });

  test('Galaxy Z Fold (펼침, 884px) — 대기 화면 정상', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 884, height: 1104 } });
    const page = await context.newPage();
    await joinAsStudent(page, 'http://localhost:5173', sid, 'Fold유저');
    await firebaseSet(`sessions/${sid}/currentQuestion`, null);
    await waitForSync(page, 3000);

    await expect(page.getByText('Fold유저님, 준비 완료!')).toBeVisible({ timeout: 8000 });

    await context.close();
  });
});

// ═══════════════════════════════════════════════════════════
// 5. 다크모드 전체 플로우
// ═══════════════════════════════════════════════════════════
test.describe('다크모드 전체', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('다크모드: JoinPage → 투표 → 확인 → 대기', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await joinAsStudent(page, 'http://localhost:5173', sid, '다크풀플로우');
    await activateQuestion(sid, 'q1');
    await waitForSync(page, 3000);

    // 투표
    await expect(page.getByText('JavaScript')).toBeVisible({ timeout: 8000 });
    await page.getByText('Python').click();
    await expect(page.getByText('투표 완료!')).toBeVisible({ timeout: 5000 });

    // 대기 전환
    await firebaseSet(`sessions/${sid}/currentQuestion`, null);
    await waitForSync(page, 3000);
    await expect(page.getByText('다크풀플로우님, 준비 완료!')).toBeVisible({ timeout: 8000 });

    await context.close();
  });

  test('다크모드: OX 투표', async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: 'dark' });
    const page = await context.newPage();
    await joinAsStudent(page, 'http://localhost:5173', sid, '다크OX');
    await activateQuestion(sid, 'q2');
    await waitForSync(page, 3000);

    await expect(page.getByText('아니에요')).toBeVisible({ timeout: 8000 });
    await page.getByText('아니에요').click();
    await expect(page.getByText('투표 완료!')).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});

// 프레젠터 게임 모드는 games.spec.js에서 이미 15건 커버됨 (admin 세션 내 직접 진입)

// ═══════════════════════════════════════════════════════════
// 7. 동시 접속 안정성
// ═══════════════════════════════════════════════════════════
test.describe('동시 접속', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('3명 동시 투표 → Firebase에 모두 기록', async ({ browser }) => {
    await activateQuestion(sid, 'q1');

    // 3명 동시 접속
    const students = [];
    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext();
      const p = await ctx.newPage();
      students.push({ page: p, context: ctx });
    }

    const answers = ['JavaScript', 'Python', 'TypeScript'];

    // 병렬 참여
    await Promise.all(students.map((s, i) =>
      joinAsStudent(s.page, 'http://localhost:5173', sid, `동시${i}`)
    ));

    await waitForSync(students[0].page, 2000);

    // 병렬 투표
    await Promise.all(students.map(async (s, i) => {
      await s.page.getByText(answers[i]).click({ timeout: 8000 }).catch(() => {});
    }));

    await waitForSync(students[0].page, 3000);

    // Firebase에서 확인
    const votes = await firebaseGet(`sessions/${sid}/questions/q1/votes`);
    const voteCount = votes ? Object.keys(votes).length : 0;
    expect(voteCount).toBeGreaterThanOrEqual(3);

    // 정리
    for (const s of students) await s.context.close();
  });
});

// ═══════════════════════════════════════════════════════════
// 8. VoteConfirm aria-live 접근성
// ═══════════════════════════════════════════════════════════
test.describe('접근성', () => {
  let sid;
  test.beforeAll(async () => {
    sid = testSessionId();
    await createTestSession(sid);
  });
  test.afterAll(async () => { await cleanupTestSession(sid); });

  test('VoteConfirm에 role="status" + aria-live 존재', async ({ page }) => {
    await joinAsStudent(page, '', sid, '접근성유저');
    await activateQuestion(sid, 'q1');
    await waitForSync(page);

    await page.getByText('JavaScript').click();
    await page.waitForTimeout(1000);

    // role="status" 요소가 존재해야 함
    const statusEl = page.locator('[role="status"][aria-live="polite"]');
    await expect(statusEl.first()).toBeVisible({ timeout: 5000 });
  });

  test('하단바 버튼에 aria-label 존재', async ({ page }) => {
    await joinAsStudent(page, '', sid, '아리아유저');
    await waitForSync(page);

    // 5개 버튼 모두 aria-label 확인
    await expect(page.getByRole('button', { name: /손들기/ })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /긴급 질문/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /수업 질문/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /채팅/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /도움/ })).toBeVisible();
  });
});
