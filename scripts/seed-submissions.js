// 전자칠판 N명 스케일 검증용 — Firebase RTDB에 더미 제출 삽입.
// 사용:
//   node scripts/seed-submissions.js <sessionId> <count>           # 자동으로 첫 aiJudge 질문 찾아 삽입
//   node scripts/seed-submissions.js <sessionId> clear             # 전부 제거
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, remove, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCsRs1BTT1NphOpbkoAwKn7rnrdQk16R2I",
  authDomain: "jinan-6c884.firebaseapp.com",
  databaseURL: "https://jinan-6c884-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jinan-6c884",
  storageBucket: "jinan-6c884.firebasestorage.app",
  messagingSenderId: "956378670080",
  appId: "1:956378670080:web:2147d0766564dd00dde4e5"
};

const [,, sessionId, arg2] = process.argv;
if (!sessionId || !arg2) {
  console.error('Usage: node scripts/seed-submissions.js <sessionId> <count|clear>');
  process.exit(1);
}
const isClear = arg2 === 'clear';
const count = isClear ? 0 : parseInt(arg2, 10);

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 짧은 placeholder 이미지 URL (쿼리로 색/텍스트 지정)
const HUES = [240, 260, 320, 40, 160, 210, 0, 170, 30, 280, 190, 55, 90, 300, 200];
const NAMES = ['김민준','이서연','박지훈','최예은','정하영','강민서','조유진','윤도윤','장서아','임채원','한시우','오지우','서주원','신하윤','문건우','배수호','권나연','손예진','황현수','류지민'];

function placeholderUrl(hue, label) {
  const bg = `hsl(${hue},70%,60%)`.replace('#', '');
  return `https://placehold.co/600x600/${hue.toString().padStart(3, '0')}6366f1/ffffff?text=${encodeURIComponent(label)}`;
}

async function findAiJudgeQuestion() {
  const snap = await get(ref(db, `sessions/${sessionId}/questions`));
  const qs = snap.val() || {};
  const entries = Object.entries(qs).filter(([, q]) => q.type === 'aiJudge');
  if (!entries.length) throw new Error('aiJudge 질문이 세션에 없습니다');
  // 가장 최근 order 것
  const sorted = entries.sort((a, b) => (b[1].order || 0) - (a[1].order || 0));
  return sorted[0][0];
}

async function run() {
  const questionId = await findAiJudgeQuestion();
  const base = `sessions/${sessionId}/questions/${questionId}/submissions`;

  if (isClear) {
    await remove(ref(db, base));
    console.log(`cleared submissions under ${base}`);
    process.exit(0);
  }

  const tasks = [];
  for (let i = 0; i < count; i++) {
    const pid = `seed_${i + 1}`;
    const name = NAMES[i % NAMES.length] + (i >= NAMES.length ? String(Math.floor(i / NAMES.length)) : '');
    const hue = HUES[i % HUES.length];
    const useCode = i % 3 === 2; // 1/3은 코드 제출
    const submission = useCode
      ? {
          name,
          title: `${name} HTML`,
          description: '',
          imageUrl: null,
          code: `<!DOCTYPE html>\n<html><body style="background:hsl(${hue},70%,55%);color:white;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><h1>${name}</h1></body></html>`,
          submittedAt: Date.now() - (count - i) * 1000,
        }
      : {
          name,
          title: `${name}의 랜딩페이지`,
          description: `${name}이(가) 만든 작품입니다.`,
          imageUrl: placeholderUrl(hue, name),
          code: '',
          submittedAt: Date.now() - (count - i) * 1000,
        };
    tasks.push(set(ref(db, `${base}/${pid}`), submission));
  }
  await Promise.all(tasks);
  console.log(`seeded ${count} submissions under ${base}`);
  process.exit(0);
}
run().catch((e) => { console.error(e); process.exit(1); });
