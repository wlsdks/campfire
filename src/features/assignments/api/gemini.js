/**
 * Gemini AI evaluation engine for assignment judging (사후 과제 + 미리보기).
 * 라이브 수업 심사는 ./geminiLive 로 분리.
 * 시상 계산은 ./awards 로 분리.
 *
 * API key는 빌드 타임 환경 변수(VITE_GEMINI_API_KEY)에서만 주입한다.
 * 클라이언트 UI/localStorage 입력 경로는 키 노출 위험이 커서 제거됨 — Google AI Studio
 * 콘솔에서 HTTP referrer 제한과 rate limit으로 quota 보호.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { JUDGES } from './judges';

let genAI = null;

const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
if (ENV_API_KEY) {
  genAI = new GoogleGenerativeAI(ENV_API_KEY);
}

export function isGeminiReady() {
  return genAI !== null;
}

/** Internal client accessor used by sibling modules (geminiLive). */
export function getGenAI() {
  return genAI;
}

const MODEL_NAME = 'gemini-2.5-flash-lite';
const MAX_INPUT_CHARS = 120000; // ~30K tokens, leaves room for system+prompt+output

export async function withRetry(fn, retries = 2, delayMs = 2000, timeoutMs = 45000) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`API 타임아웃 (${Math.round(timeoutMs / 1000)}초)`)), timeoutMs)
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

/**
 * Fetch URL → base64 data part for Gemini inlineData.
 * Firebase Storage URL도 fetch 가능 (CORS 설정됨).
 */
export async function urlToInlinePart(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`이미지 다운로드 실패 (${res.status})`);
  const blob = await res.blob();

  // Gemini inlineData는 base64 인코딩 후 전체 request에 포함되므로 너무 크면 API 호출 실패.
  // 7MB 원본 → base64 후 ~9.3MB. 여유분 고려해 7MB 상한.
  const MAX_BYTES = 7 * 1024 * 1024;
  if (blob.size > MAX_BYTES) {
    throw new Error(`이미지가 너무 큽니다 (${(blob.size / 1024 / 1024).toFixed(1)}MB) — 7MB 이하 권장`);
  }

  const mimeType = blob.type || 'image/jpeg';

  // FileReader API로 base64 변환 — 기존 `binary += String.fromCharCode(bytes[i])` 루프는
  // O(N²) 문자열 concat + 대용량 시 스택 오버플로 위험. readAsDataURL은 네이티브 구현으로 효율적.
  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') { reject(new Error('이미지 읽기 실패')); return; }
      const comma = dataUrl.indexOf(',');
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.onerror = () => reject(reader.error || new Error('이미지 읽기 실패'));
    reader.readAsDataURL(blob);
  });

  return { inlineData: { mimeType, data: base64 } };
}

export function parseJudgeResponse(text) {
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

const EVALUATION_GUIDE = `당신은 바이브코딩 강의의 사후 과제를 심사하는 심사위원입니다.

[강의 배경]
- "바이브코딩으로 '나'만의 서비스 만들기" 강의의 사후 과제
- 수강생은 비개발자입니다 (코딩 경험 없음)
- 바이브코딩: 코드를 직접 작성하지 않고, AI에게 말로 설명해서 서비스를 만드는 것
- 핵심 교훈: "문제정의가 75%", "심플하게 시작, 조금씩 발전"

[과제 내용]
- 수강생이 자신의 업무/일상 불편함을 찾아 문제를 정의
- PRD(기획서)를 작성 — 텍스트로 직접 작성합니다
- 바이브코딩으로 실제 결과물을 만들고, 결과물의 스크린샷(여러 장 가능)을 제출합니다
- 결과물 HTML 코드는 선택 항목으로, 있으면 함께 제출합니다
- 따라서 평가는 (1) PRD 텍스트 (2) 결과물 스크린샷 이미지 (3) HTML 코드(있을 시) 이 3가지를 종합하여 진행합니다

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
  if (submission.prdContent) {
    let prd = submission.prdContent;
    if (prd.length > 20000) prd = prd.slice(0, 20000) + '\n[...생략...]';
    parts.push(`[PRD/기획서 (학생 작성 텍스트)]\n${prd}`);
  }
  if (Array.isArray(submission.screenshots) && submission.screenshots.length > 0) {
    parts.push(`[결과물 스크린샷] ${submission.screenshots.length}장 (이미지로 함께 첨부됨)`);
  }
  if (submission.code) {
    let code = submission.code;
    if (code.length > MAX_INPUT_CHARS) {
      code = code.slice(0, MAX_INPUT_CHARS) + `\n\n[... 이하 ${submission.code.length - MAX_INPUT_CHARS}자 생략됨 ...]`;
    }
    parts.push(`[학생이 첨부한 결과물 HTML 코드]\n${code}`);
  }
  // 구 폼 호환
  if (submission.fileContent) {
    let code = submission.fileContent;
    if (code.length > MAX_INPUT_CHARS) {
      code = code.slice(0, MAX_INPUT_CHARS) + `\n\n[... 이하 ${submission.fileContent.length - MAX_INPUT_CHARS}자 생략됨 ...]`;
    }
    parts.push(`[업로드된 코드/파일]\n${code}`);
  }
  if (submission.description) {
    parts.push(`[프로젝트 설명]\n${submission.description}`);
  }
  return parts.join('\n\n') || '(제출물 없음)';
}

/**
 * 제출물의 스크린샷(여러 장)을 Gemini inlineData parts로 변환.
 * 한 장이라도 실패해도 다른 자료(PRD/프롬프트)로 평가가 가능하도록 실패는 swallow.
 */
async function buildScreenshotParts(submission, max = 5) {
  const shots = Array.isArray(submission.screenshots) ? submission.screenshots.filter(s => s?.url) : [];
  if (shots.length === 0) return [];
  const subset = shots.slice(0, max);
  const out = [{ text: `\n[결과물 스크린샷 ${subset.length}장 — 순서대로 첨부]` }];
  for (let i = 0; i < subset.length; i++) {
    try {
      const part = await urlToInlinePart(subset[i].url);
      out.push({ text: `\n— 스크린샷 ${i + 1} —` });
      out.push(part);
    } catch {
      out.push({ text: `\n— 스크린샷 ${i + 1} (불러오기 실패, 무시) —` });
    }
  }
  return out;
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

  const screenshotParts = await buildScreenshotParts(submission, 5);
  const parts = [{ text: prompt }, ...screenshotParts];

  const result = await withRetry(() =>
    model.generateContent({
      contents: [{ role: 'user', parts }],
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
 * passThreshold: 통과로 인정할 최소 추천 수 (기본 3, 강사가 과제별로 지정).
 */
export async function judgeSubmission(submission, onJudgeComplete, passThreshold = 3) {
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
      passed: selectedCount >= passThreshold,
      passThreshold,
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

  const screenshotParts = await buildScreenshotParts(submission, 4);
  const parts = [{ text: prompt }, ...screenshotParts];

  const result = await withRetry(() =>
    model.generateContent({
      contents: [{ role: 'user', parts }],
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
