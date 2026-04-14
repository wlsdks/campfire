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
