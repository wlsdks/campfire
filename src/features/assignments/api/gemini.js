/**
 * Gemini AI evaluation engine for assignment judging.
 * Ported from ai-judge project, adapted for Pick.
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

// Restore from localStorage on load
const stored = getStoredApiKey();
if (stored) {
  initGemini(stored);
}

// Fallback to env variable if still not initialized
if (!genAI && import.meta.env.VITE_GEMINI_API_KEY) {
  initGemini(import.meta.env.VITE_GEMINI_API_KEY);
}

const EVALUATION_PROMPT = `당신은 바이브코딩 강의의 사후 과제를 심사하는 심사위원입니다.

[강의 배경]
- "바이브코딩으로 '나'만의 서비스 만들기" 강의의 사후 과제
- 수강생은 비개발자입니다 (코딩 경험 없음)
- 바이브코딩: 코드를 직접 작성하지 않고, AI에게 말로 설명해서 서비스를 만드는 것
- 핵심 교훈: "문제정의가 75%", "심플하게 시작, 조금씩 발전"

[과제 내용]
- 수강생이 자신의 업무/일상 불편함을 찾아 문제를 정의하고
- PRD(기획서)를 작성하여 AI에게 전달하고
- 바이브코딩으로 실제 결과물을 만들어 제출

[제출물]
수강생이 아래 중 하나 이상을 제출했습니다:
1. 프로젝트 URL (배포된 사이트 또는 GitHub 링크)
2. HTML 코드 (직접 업로드한 파일)
3. 프로젝트 설명 (텍스트)

반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 포함하지 마세요:
{
  "score": (1~10 정수),
  "selected": (true/false - 이 작품을 선택하는지),
  "comment": "(3~5문장의 심사평, 당신의 캐릭터에 맞는 말투로)",
  "strengths": ["강점1", "강점2"],
  "improvements": ["개선점1", "개선점2"]
}`;

/**
 * Single judge evaluates a single submission.
 */
export async function evaluateSubmission(judge, submission) {
  if (!genAI) throw new Error('Gemini API가 초기화되지 않았습니다.');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  // Build content section from available submission data
  const contentParts = [];
  if (submission.projectUrl) {
    contentParts.push(`[프로젝트 URL]\n${submission.projectUrl}`);
  }
  if (submission.fileContent) {
    contentParts.push(`[업로드된 코드]\n${submission.fileContent}`);
  }
  if (submission.prdContent) {
    contentParts.push(`[PRD/기획서]\n${submission.prdContent}`);
  }
  if (submission.description) {
    contentParts.push(`[프로젝트 설명]\n${submission.description}`);
  }

  const prompt = `${EVALUATION_PROMPT}

[심사 대상]
- 제출자: ${submission.name}

${contentParts.join('\n\n') || '(제출물 없음)'}

위 제출물을 평가해주세요.`;

  const result = await model.generateContent({
    contents: [
      { role: 'user', parts: [{ text: judge.systemPrompt }] },
      { role: 'model', parts: [{ text: '네, 해당 심사위원으로서 평가하겠습니다.' }] },
      { role: 'user', parts: [{ text: prompt }] },
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  });

  let text = result.response.text();
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        throw new Error(`심사 응답 파싱 실패: ${text.slice(0, 200)}`);
      }
    }
    throw new Error(`심사 응답 파싱 실패: ${text.slice(0, 200)}`);
  }
}

/**
 * Full panel of judges evaluates a single submission.
 */
export async function judgeSubmission(submission, onJudgeComplete) {
  const results = {};

  for (const judge of JUDGES) {
    try {
      results[judge.id] = await evaluateSubmission(judge, submission);
      results[judge.id].judgeId = judge.id;
      results[judge.id].judgeName = judge.name;
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
  }

  const selectedCount = Object.values(results).filter(r => r.selected).length;
  const totalScore = Object.values(results).reduce((sum, r) => sum + (r.score || 0), 0);
  const avgScore = totalScore / Object.keys(results).length;

  return {
    results,
    summary: {
      selectedCount,
      totalJudges: Object.keys(results).length,
      passed: selectedCount >= 3,
      avgScore: Math.round(avgScore * 10) / 10,
      totalScore,
    },
  };
}

/**
 * Calculate awards from all judged results.
 * @param {Array} allResults — [{ submissionId, name, results, summary }]
 */
export function calculateAwards(allResults) {
  if (!allResults.length) return {};

  const awards = {};
  const sorted = [...allResults].sort((a, b) => b.summary.avgScore - a.summary.avgScore);

  // Top 3 ranked awards
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

  // Special awards — best score from specific judge (excluding top 3)
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
      .filter(e => e.results[award.judgeId])
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
