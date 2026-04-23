/**
 * Gemini AI evaluation engine for assignment judging.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { JUDGES } from './judges';

let genAI = null;

export function initGemini(apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
  localStorage.setItem('pick_gemini_api_key', apiKey);
}

export function getStoredApiKey() {
  return localStorage.getItem('pick_gemini_api_key') || '';
}

export function isGeminiReady() {
  return genAI !== null;
}

const stored = getStoredApiKey();
if (stored) initGemini(stored);
if (!genAI && import.meta.env.VITE_GEMINI_API_KEY) {
  initGemini(import.meta.env.VITE_GEMINI_API_KEY);
}

const MODEL_NAME = 'gemini-2.5-flash-lite';
// 라이브 AI 심사 전용 — 최신 preview 모델 사용 (멀티모달 품질 우선)
const LIVE_MODEL_NAME = 'gemini-3-flash-preview';
const MAX_INPUT_CHARS = 120000; // ~30K tokens, leaves room for system+prompt+output

async function withRetry(fn, retries = 2, delayMs = 2000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API 타임아웃 (45초)')), 45000)
        ),
      ]);
    } catch (err) {
      if (i === retries) throw err;
      const msg = err.message || '';
      const isTransient =
        msg.includes('429') || msg.includes('503') ||
        msg.includes('NETWORK') || msg.includes('network') ||
        msg.includes('Failed to fetch') || msg.includes('타임아웃');
      if (!isTransient) throw err;
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

const EVALUATION_GUIDE = `당신은 바이브코딩 강의의 사후 과제를 심사하는 심사위원입니다.

[강의 배경]
- "바이브코딩으로 '나'만의 서비스 만들기" 강의의 사후 과제
- 수강생은 비개발자입니다 (코딩 경험 없음)
- 바이브코딩: 코드를 직접 작성하지 않고, AI에게 말로 설명해서 서비스를 만드는 것
- 핵심 교훈: "문제정의가 75%", "심플하게 시작, 조금씩 발전"

[과제 내용]
- 수강생이 자신의 업무/일상 불편함을 찾아 문제를 정의
- PRD(기획서)를 작성하여 AI에게 전달
- 바이브코딩으로 실제 결과물(주로 HTML)을 만들어 제출

[점수 기준 — 반드시 이 척도로 평가]
- 1~3점: 심각한 결함 (동작 안 함, 과제 핵심 미이해)
- 4~5점: 평균 이하 (일부 기능 부족, 문제 정의 흐릿)
- 6~7점: 평균 (과제 요구사항은 충족, 무난한 수준)
- 8점: 인상적 (비개발자로서 뛰어난 결과물, 자기만의 관점)
- 9점: 수업 베스트 후보 (독창적이고 완성도 높음)
- 10점: 예외적인 수작 (극히 드물게 부여)

"selected" 필드는 이 작품을 시상 후보로 추천하는지 여부입니다 (본인 관점 기준 상위권이라 판단할 때만 true).

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트나 코드 블록 없이 순수 JSON만:
{
  "score": (1~10 정수),
  "selected": (true/false),
  "comment": "(3~5문장의 심사평, 당신의 캐릭터 말투)",
  "strengths": ["강점1", "강점2"],
  "improvements": ["개선점1", "개선점2"]
}`;

function buildContent(submission) {
  const parts = [];
  if (submission.fileContent) {
    let code = submission.fileContent;
    if (code.length > MAX_INPUT_CHARS) {
      code = code.slice(0, MAX_INPUT_CHARS) + `\n\n[... 이하 ${submission.fileContent.length - MAX_INPUT_CHARS}자 생략됨 ...]`;
    }
    parts.push(`[업로드된 코드/파일]\n${code}`);
  }
  if (submission.prdContent) {
    let prd = submission.prdContent;
    if (prd.length > 20000) prd = prd.slice(0, 20000) + '\n[...생략...]';
    parts.push(`[PRD/기획서]\n${prd}`);
  }
  if (submission.description) {
    parts.push(`[프로젝트 설명]\n${submission.description}`);
  }
  return parts.join('\n\n') || '(제출물 없음)';
}

function parseJudgeResponse(text) {
  let cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); }
      catch { throw new Error(`심사 응답 파싱 실패: ${cleaned.slice(0, 200)}`); }
    }
    throw new Error(`심사 응답 파싱 실패: ${cleaned.slice(0, 200)}`);
  }
}

export async function evaluateSubmission(judge, submission) {
  if (!genAI) throw new Error('Gemini API가 초기화되지 않았습니다.');

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: `${judge.systemPrompt}\n\n${EVALUATION_GUIDE}`,
  });

  const prompt = `[심사 대상]
- 제출자: ${submission.name}

${buildContent(submission)}

위 제출물을 평가해주세요.`;

  const result = await withRetry(() =>
    model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.35,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
  );

  return parseJudgeResponse(result.response.text());
}

/**
 * Full panel of 7 judges evaluates a single submission — in parallel.
 */
export async function judgeSubmission(submission, onJudgeComplete) {
  const results = {};

  await Promise.all(
    JUDGES.map(async (judge) => {
      try {
        const r = await evaluateSubmission(judge, submission);
        results[judge.id] = { ...r, judgeId: judge.id, judgeName: judge.name };
      } catch (error) {
        results[judge.id] = {
          judgeId: judge.id,
          judgeName: judge.name,
          score: 0,
          selected: false,
          comment: `심사 중 오류 발생: ${error.message}`,
          strengths: [],
          improvements: [],
          error: true,
        };
      }
      onJudgeComplete?.(judge.id, results[judge.id]);
    })
  );

  const valid = Object.values(results).filter(r => !r.error);
  const selectedCount = valid.filter(r => r.selected).length;
  const totalScore = valid.reduce((sum, r) => sum + (r.score || 0), 0);
  const avgScore = valid.length ? totalScore / valid.length : 0;

  return {
    results,
    summary: {
      selectedCount,
      totalJudges: valid.length,
      erroredJudges: JUDGES.length - valid.length,
      passed: selectedCount >= 3,
      avgScore: Math.round(avgScore * 10) / 10,
      totalScore,
    },
  };
}

const PREVIEW_PROMPT = `당신은 바이브코딩 강의의 따뜻한 교육자입니다. 수강생(비개발자)이 최종 제출 전에 피드백을 요청했습니다.

[당신의 역할]
- 점수를 매기는 게 아니라, 제출 전 개선할 수 있는 힌트를 주는 코치입니다.
- 격려하면서도 구체적인 개선 방향을 짚어줍니다.
- 완벽한 결과물은 아직 아닐 수 있음을 이해합니다.

[강의 배경]
- "바이브코딩으로 '나'만의 서비스 만들기" 강의의 사후 과제
- 핵심 교훈: "문제정의가 75%", "심플하게 시작, 조금씩 발전"
- 수강생이 AI와 대화하며 만든 결과물을 제출합니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "overallImpression": "(전반적 인상 1~2문장, 따뜻하게)",
  "strengths": ["강점1", "강점2", "강점3"],
  "improvements": ["구체적 개선점1", "구체적 개선점2", "구체적 개선점3"],
  "quickWin": "(지금 당장 바꾸면 좋아질 한 가지, 구체적으로)"
}`;

/**
 * Pre-submission preview — 제출 전 형성 피드백. 점수 없이 개선 힌트만.
 */
export async function previewSubmission(submission) {
  if (!genAI) throw new Error('Gemini API가 초기화되지 않았습니다.');

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction: PREVIEW_PROMPT,
  });

  const prompt = `[제출 예정 작품]
${buildContent(submission)}

위 작품을 보고 개선 힌트를 주세요.`;

  const result = await withRetry(() =>
    model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    })
  );

  return parseJudgeResponse(result.response.text());
}

const LIVE_EVALUATION_GUIDE = `당신은 라이브 수업 중 학생이 방금 만든 실습 결과물을 평가합니다.

[맥락]
- 수강생은 비개발자이며, 수업에서 배운 내용을 바로 실습해서 제출합니다.
- 제출물은 이미지 1장(스크린샷/사진)이 기본이고, 제목과 짧은 설명이 같이 옵니다.
- 라이브이므로 완성도보다 시도/아이디어/실습 결과를 격려하며 평가합니다.

[점수 기준 — 반드시 이 척도로 평가]
- 1~3점: 과제 의도를 크게 벗어남 (이미지가 주제와 무관/비어있음)
- 4~5점: 시도했지만 핵심이 흐릿함
- 6~7점: 기본 요구는 충족 (무난한 수준)
- 8점: 라이브 실습치고 인상적 (자기 관점 보임)
- 9점: 베스트 후보 (독창성 또는 완성도 돋보임)
- 10점: 드문 수작

반드시 아래 JSON 형식으로만 응답하세요:
{
  "score": (1~10 정수),
  "comment": "(2~3문장의 심사평, 당신의 캐릭터 말투)",
  "highlight": "(이 작품의 한 줄 하이라이트, 15~30자)"
}`;

/**
 * Fetch URL → base64 data part for Gemini inlineData.
 * Firebase Storage URL도 fetch 가능 (CORS 설정됨).
 */
async function urlToInlinePart(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`이미지 다운로드 실패 (${res.status})`);
  const blob = await res.blob();
  const mimeType = blob.type || 'image/jpeg';
  const buffer = await blob.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const base64 = btoa(binary);
  return { inlineData: { mimeType, data: base64 } };
}

/**
 * Build multimodal parts for a live submission.
 * - imageUrl → inlineData (이미지)
 * - title/description → 텍스트
 *
 * 이미지 로드 실패는 throw로 승격 — 네트워크 문제로 다른 학생 대비 점수가 왜곡되는
 * 것보다 "이 판사 실패"로 마킹 후 avgScore에서 제외하는 게 공정함.
 */
async function buildLiveParts(submission) {
  const parts = [];
  const textBits = [`[제출자] ${submission.name}`];
  if (submission.title) textBits.push(`[제목] ${submission.title}`);
  if (submission.description) textBits.push(`[설명]\n${submission.description.slice(0, 600)}`);
  // HTML/JS/CSS 코드 제출 — 최대 40KB로 잘라서 평가. 작품 동작 품질도 함께 판단.
  if (submission.code) {
    const code = submission.code.length > 40000
      ? submission.code.slice(0, 40000) + '\n[... 이하 생략 ...]'
      : submission.code;
    textBits.push(`[제출 코드 (HTML/JS/CSS)]\n${code}`);
  }
  parts.push({ text: textBits.join('\n') });

  if (submission.imageUrl) {
    // 3회까지 재시도 — 일시적 네트워크 지터 대응
    let imagePart = null;
    let lastErr = null;
    for (let i = 0; i < 3; i++) {
      try {
        imagePart = await urlToInlinePart(submission.imageUrl);
        break;
      } catch (err) {
        lastErr = err;
        if (i < 2) await new Promise(r => setTimeout(r, 400 * (i + 1)));
      }
    }
    if (!imagePart) throw lastErr || new Error('이미지 로드 실패');
    parts.push({ text: '\n[제출 이미지]' });
    parts.push(imagePart);
  }
  return parts;
}

/**
 * Evaluate one live submission with one judge (multimodal).
 * 모델 fallback: LIVE_MODEL_NAME(preview) 실패 시 stable 모델로 자동 재시도 — preview 모델이
 * 지역/쿼터에 따라 제공 안 되는 경우도 있어 라이브 수업에서 중단되지 않도록 방어.
 */
// 최신 preview → latest alias → stable 순. preview가 미릴리즈/권한 없으면 자동 fallback.
const LIVE_MODEL_FALLBACKS = [
  LIVE_MODEL_NAME,           // gemini-3-flash-preview (사용자 요청 모델)
  'gemini-flash-latest',     // 최신 Flash alias
  'gemini-2.5-flash',        // Flash stable
  MODEL_NAME,                // gemini-2.5-flash-lite (최후 보루)
];

async function evaluateLiveSubmission(judge, submission, questionTitle) {
  if (!genAI) throw new Error('Gemini API가 초기화되지 않았습니다.');

  const contextLine = questionTitle
    ? `[수업 실습 주제]\n${questionTitle}\n\n`
    : '';
  const systemInstruction = `${judge.systemPrompt}\n\n${LIVE_EVALUATION_GUIDE}\n\n${contextLine}위 주제에 대한 제출물을 평가하세요.`;
  const parts = await buildLiveParts(submission);

  let lastErr = null;
  for (const modelName of LIVE_MODEL_FALLBACKS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
      const result = await withRetry(() =>
        model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
            responseMimeType: 'application/json',
            thinkingConfig: { thinkingBudget: 0 },
          },
        })
      );
      return parseJudgeResponse(result.response.text());
    } catch (err) {
      lastErr = err;
      const msg = (err?.message || '').toLowerCase();
      // 모델 미지원/잘못된 ID는 다음 fallback으로. 429(rate)나 파싱 에러는 즉시 throw.
      const isModelIssue = msg.includes('not found') || msg.includes('404') || msg.includes('400')
        || msg.includes('unsupported') || msg.includes('does not exist')
        || msg.includes('invalid') || msg.includes('is not supported');
      if (!isModelIssue) throw err;
    }
  }
  throw lastErr || new Error('모든 모델이 응답하지 못했습니다.');
}

/**
 * Live judging — 7 judges in parallel for one submission.
 * onJudgeStart(judge): 판사가 "지금 이 작품 보는 중" 시작 시점 훅 (라이브 중계용)
 * onJudgeComplete(judgeId, result): 판사 완료
 */
export async function judgeLiveSubmission(submission, questionTitle, onJudgeComplete, onJudgeStart) {
  const results = {};

  await Promise.all(
    JUDGES.map(async (judge) => {
      // thinking 방송 — 실제 호출 전/중에 전자칠판에 띄움
      onJudgeStart?.(judge);
      try {
        const r = await evaluateLiveSubmission(judge, submission, questionTitle);
        results[judge.id] = {
          ...r,
          judgeId: judge.id,
          judgeName: judge.name,
        };
      } catch (error) {
        results[judge.id] = {
          judgeId: judge.id,
          judgeName: judge.name,
          score: 0,
          comment: `심사 중 오류: ${error.message}`,
          highlight: '',
          error: true,
        };
      }
      onJudgeComplete?.(judge.id, results[judge.id]);
    })
  );

  const valid = Object.values(results).filter(r => !r.error);
  const totalScore = valid.reduce((sum, r) => sum + (r.score || 0), 0);
  const avgScore = valid.length ? totalScore / valid.length : 0;

  return {
    results,
    summary: {
      totalJudges: valid.length,
      erroredJudges: JUDGES.length - valid.length,
      avgScore: Math.round(avgScore * 10) / 10,
      totalScore,
    },
  };
}

/**
 * Live top-3 calculation. allResults shape:
 * [{ submissionId, name, results, summary }]
 * Returns { first, second, third } each { submissionId, name, score, comment }.
 */
export function calculateLiveTop3(allResults) {
  if (!allResults.length) return {};
  // 모든 판사가 실패한 제출(totalJudges === 0)은 순위에서 제외 — 아니면 0점 제출이 3등으로 들어올 수 있음.
  const valid = allResults.filter(r => (r.summary?.totalJudges ?? 0) > 0);
  const sorted = [...valid].sort((a, b) => b.summary.avgScore - a.summary.avgScore);
  const rankKeys = ['first', 'second', 'third'];
  const top = {};

  sorted.slice(0, 3).forEach((entry, i) => {
    if (!rankKeys[i]) return;
    const valid = Object.values(entry.results).filter(r => !r.error);
    // Representative comment: highest-scoring judge's comment
    const best = valid.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    top[rankKeys[i]] = {
      submissionId: entry.submissionId,
      name: entry.name,
      score: entry.summary.avgScore,
      topScore: best?.score || 0,
      comment: best?.comment || '',
      highlight: best?.highlight || '',
      bestJudgeId: best?.judgeId || null,
      bestJudgeName: best?.judgeName || null,
    };
  });
  return top;
}

/**
 * Calculate awards from all judged results.
 */
export function calculateAwards(allResults) {
  if (!allResults.length) return {};

  const awards = {};
  const sorted = [...allResults].sort((a, b) => b.summary.avgScore - a.summary.avgScore);

  const rankAwards = ['grand', 'excellence', 'outstanding'];
  sorted.slice(0, 3).forEach((entry, i) => {
    if (rankAwards[i]) {
      awards[rankAwards[i]] = {
        submissionId: entry.submissionId,
        name: entry.name,
        score: entry.summary.avgScore,
      };
    }
  });

  const topRankIds = new Set(Object.values(awards).map(a => a.submissionId));

  const specialAwards = [
    { id: 'planning', judgeId: 'kim-gihoek' },
    { id: 'creative', judgeId: 'jung-changui' },
    { id: 'design', judgeId: 'lee-dija' },
    { id: 'practical', judgeId: 'choi-silyong' },
  ];

  for (const award of specialAwards) {
    const candidates = allResults
      .filter(e => !topRankIds.has(e.submissionId))
      .filter(e => e.results[award.judgeId] && !e.results[award.judgeId].error)
      .sort((a, b) => (b.results[award.judgeId]?.score || 0) - (a.results[award.judgeId]?.score || 0));

    if (candidates[0]) {
      const winner = candidates[0];
      awards[award.id] = {
        submissionId: winner.submissionId,
        name: winner.name,
        score: winner.results[award.judgeId]?.score || 0,
      };
      topRankIds.add(winner.submissionId);
    }
  }

  return awards;
}
