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
// 라이브 AI 심사 전용 — flash-lite로 전환 (Pro/Flash는 100명 규모에서 429/RPM 한도 다발).
// lite는 Tier 1 기준 RPM ~4000으로 여유. 7판사 페르소나 동시 호출의 다양성은 prompt로 보강.
const LIVE_MODEL_NAME = 'gemini-2.5-flash-lite';
const MAX_INPUT_CHARS = 120000; // ~30K tokens, leaves room for system+prompt+output

async function withRetry(fn, retries = 2, delayMs = 2000, timeoutMs = 45000) {
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

const LIVE_EVALUATION_GUIDE = `당신은 라이브 수업 중 학생이 방금 만든 실습 결과물을 평가합니다.

[맥락]
- 수강생은 비개발자이며, 수업에서 배운 내용을 바로 실습해서 제출합니다.
- 제출물은 이미지 1장(스크린샷/사진)이 기본이고, 제목과 짧은 설명이 같이 옵니다 (HTML 코드 제출도 가능).
- 라이브이므로 완성도보다 시도/아이디어/실습 결과를 격려하며 평가합니다.
- **심사평은 수업에 참여한 다른 학생들 앞에서 공개됩니다.** 왜 이 점수인지 다른 학습자가 납득할 수 있는 구체적 근거가 필요합니다.

[점수 기준 — 반드시 이 척도로 평가]
- 1~3점: 과제 의도를 크게 벗어남 (이미지가 주제와 무관/비어있음)
- 4~5점: 시도했지만 핵심이 흐릿함
- 6~7점: 기본 요구는 충족 (무난한 수준)
- 8점: 라이브 실습치고 인상적 (자기 관점 보임)
- 9점: 베스트 후보 (독창성 또는 완성도 돋보임)
- 10점: 드문 수작

[심사평 작성 원칙]
- **구체적 근거 제시**: "색감이 좋다"가 아니라 "마젠타-보라 그라데이션이 주제의 감정을 시각화했다"처럼 어떤 요소가 어떻게 기여했는지 적시
- **두괄식**: 첫 문장에 결론(강점/약점)을 명시하고 뒤이어 근거 설명
- **당신의 전문 분야 렌즈 유지**: 당신이 맡은 평가 기준에서 본 시선을 고수 (예: 디자이너는 시각적 증거, QA는 기능 동작, PM은 문제 정의)
- **격려 + 성장 포인트**: 라이브 수업이므로 잘한 점 먼저, 개선 제안은 1개만 간결하게
- 당신의 캐릭터 말투 유지 (김기획은 존중하는 전문 어조, 박사용은 직설적 사용자 관점 등)

반드시 아래 JSON 형식으로만 응답하세요:
{
  "score": (1~10 정수),
  "comment": "(4~6문장, 200~350자. 첫 문장에 결론, 이후 2~3가지 구체적 관찰 근거, 마지막에 성장 포인트 또는 격려. 당신의 캐릭터 말투)",
  "highlight": "(이 작품을 한 줄로 요약하는 설득력 있는 카피, 40~70자. '좋다/멋지다' 같은 일반 형용사 금지, 구체 관찰에서 도출)"
}`;

/**
 * Fetch URL → base64 data part for Gemini inlineData.
 * Firebase Storage URL도 fetch 가능 (CORS 설정됨).
 */
async function urlToInlinePart(url) {
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
  // 심사 편향 방지를 위해 제출자 이름은 AI에 전달하지 않음 — 작품(제목/설명/이미지/코드) 자체만 평가.
  const textBits = [];
  if (submission.title) textBits.push(`[제목] ${submission.title}`);
  if (submission.description) textBits.push(`[설명]\n${submission.description.slice(0, 600)}`);
  // HTML/JS/CSS 코드 제출 — 최대 40KB로 잘라서 평가. 작품 동작 품질도 함께 판단.
  if (submission.code) {
    const code = submission.code.length > 40000
      ? submission.code.slice(0, 40000) + '\n[... 이하 생략 ...]'
      : submission.code;
    textBits.push(`[제출 코드 (HTML/JS/CSS)]\n${code}`);
  }
  // 텍스트가 전혀 없고 이미지만 있는 경우에도 Gemini 멀티모달은 동작 — 빈 text 파트는 생략.
  if (textBits.length > 0) parts.push({ text: textBits.join('\n') });

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
// flash-lite 우선 (RPM/비용 최적). lite가 모델 미지원/400 에러 시에만 flash로 fallback.
// 429(rate)는 lite에서도 거의 안 터지지만 만약 발생하면 즉시 throw → 상위 retry가 처리.
const LIVE_MODEL_FALLBACKS = [
  LIVE_MODEL_NAME,           // gemini-2.5-flash-lite (라이브 심사 기본)
  'gemini-2.5-flash',        // 만에 하나 lite가 응답 못할 때
];

/**
 * 7명 페르소나를 합친 system instruction 생성.
 * 한 번의 호출로 모든 판사 결과를 받기 위함 — RPM/quota 절감.
 */
function buildAllJudgesSystemInstruction(questionTitle) {
  const judgesBlock = JUDGES.map((j, i) => `### ${i + 1}. ${j.name} (id: "${j.id}") — ${j.role}
- 성격: ${j.personality}
- 평가 초점: ${j.focus}

${j.systemPrompt}`).join('\n\n---\n\n');

  const idsBlock = JUDGES.map(j => `  "${j.id}": { "score": (1~10 정수), "comment": "...", "highlight": "..." }`).join(',\n');

  const contextLine = questionTitle
    ? `\n[수업 실습 주제]\n${questionTitle}\n`
    : '';

  return `당신은 7명의 심사위원을 동시에 연기하는 평가자입니다. 같은 작품을 7개의 서로 다른 시선으로 봐야 합니다.

⚠️ 절대 금지 사항 (이걸 어기면 평가는 무효):
1. **7명이 비슷한 코멘트를 하는 것** — 각 판사의 전문 분야가 다르므로 같은 작품을 봐도 주목하는 지점이 달라야 합니다.
2. **모든 판사가 비슷한 점수를 주는 것** — 강점/약점 인식이 다르므로 점수 분포가 자연스럽게 2~4점 차이가 나야 합니다 (예: 7,8,6,9,5,7,8).
3. **판사 캐릭터 말투를 흐리게 쓰는 것** — 김기획은 "~하면 더 좋았을 것 같습니다" 전문 어조, 박사용은 "저는 이 부분이 헷갈렸어요" 일반인 어조, 이디자는 "여백이 참 좋네요" 감성 어조처럼 명확히 달라야 합니다.

✅ 올바른 평가 예시:
- 같은 작품을 보고 김기획은 "문제 정의가 약하다"(6점), 이디자는 "색감 조합이 인상적"(8점), 한완성은 "기능은 동작하나 에러 처리 없음"(7점)처럼 **각자의 렌즈로 다른 결론**.
- 한 명이 칭찬한 부분을 다른 한 명이 비판하는 것이 자연스럽습니다.
${contextLine}
${LIVE_EVALUATION_GUIDE}

[심사위원단 — 각자의 페르소나]

${judgesBlock}

---

[출력 형식 — 반드시 이 JSON 구조로만 응답]
순수 JSON만, 코드블록/설명 텍스트 금지. 7명 모두 빠짐없이 포함:

{
${idsBlock}
}

각 심사위원의 comment는 자기 캐릭터 말투를 명확히 드러내고(김기획=PM 어조, 박사용=일반 사용자 어조, 이디자=감성적 디자이너 어조 등), highlight는 그 판사 관점에서 본 한 줄 카피(40~70자)여야 합니다.`;
}

/**
 * Evaluate one submission with ALL 7 judges in a SINGLE Gemini call.
 * Returns { [judgeId]: { score, comment, highlight, judgeId, judgeName } }
 *
 * 이전 구조: 7명 × N건 = 7N회 호출 (rate limit + quota 부담)
 * 신 구조: N건 = N회 호출 (1/7로 축소)
 */
async function evaluateAllJudgesAtOnce(submission, questionTitle) {
  if (!genAI) throw new Error('Gemini API가 초기화되지 않았습니다.');

  const systemInstruction = buildAllJudgesSystemInstruction(questionTitle);
  const parts = await buildLiveParts(submission);

  let lastErr = null;
  for (const modelName of LIVE_MODEL_FALLBACKS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
      const isPro = /pro/i.test(modelName);
      // 7명분 출력 + 페르소나 다양성 확보:
      // - maxOutputTokens 8192 (7판사 × ~400~600토큰 + JSON 오버헤드)
      // - temperature 0.75: lite가 thinking 없이도 페르소나 차별화하도록 발산성 ↑
      // - 타임아웃 60초: lite는 Pro보다 빠르지만 7판사 출력은 여전히 무거움
      const result = await withRetry(
        () => model.generateContent({
          contents: [{ role: 'user', parts }],
          generationConfig: {
            temperature: 0.75,
            maxOutputTokens: 8192,
            responseMimeType: 'application/json',
            ...(isPro ? {} : { thinkingConfig: { thinkingBudget: 0 } }),
          },
        }),
        2,
        2500,
        60000,
      );
      const raw = parseJudgeResponse(result.response.text());

      // 응답 검증 — 7명 모두 있어야 정상. 누락된 판사는 에러로 마킹.
      const out = {};
      for (const judge of JUDGES) {
        const r = raw[judge.id];
        if (r && typeof r.score === 'number') {
          out[judge.id] = {
            score: r.score,
            comment: r.comment || '',
            highlight: r.highlight || '',
            judgeId: judge.id,
            judgeName: judge.name,
          };
        } else {
          out[judge.id] = {
            judgeId: judge.id,
            judgeName: judge.name,
            score: 0,
            comment: '심사 응답에서 이 판사 결과 누락',
            highlight: '',
            error: true,
          };
        }
      }
      return out;
    } catch (err) {
      lastErr = err;
      const msg = (err?.message || '').toLowerCase();
      // 모델 미지원/잘못된 ID는 다음 fallback. 429(rate)·파싱 에러는 즉시 throw.
      const isModelIssue = msg.includes('not found') || msg.includes('404') || msg.includes('400')
        || msg.includes('unsupported') || msg.includes('does not exist')
        || msg.includes('invalid') || msg.includes('is not supported');
      if (!isModelIssue) throw err;
    }
  }
  throw lastErr || new Error('모든 모델이 응답하지 못했습니다.');
}

/**
 * Live judging — ONE Gemini call per submission, returns all 7 judges' verdicts.
 * 호출 수: 7N → N (rate limit 부담 1/7로 감소).
 *
 * 학생들의 "판사 7명이 차례로 고민하는" 라이브 연출은 클라이언트에서 유지:
 * API 응답 후, onJudgeStart/onJudgeComplete를 stagger로 순차 방송.
 *
 * onJudgeStart(judge): 판사가 "지금 이 작품 보는 중" 시작 시점 훅
 * onJudgeComplete(judgeId, result): 판사 완료
 */
export async function judgeLiveSubmission(submission, questionTitle, onJudgeComplete, onJudgeStart) {
  // pacing 파라미터 — 전자칠판에 7명 판사의 "조사 중 → 평가 완료" 흐름을 체감하도록.
  const START_STAGGER_MS = 350;
  const MIN_THINK_MS = 1800;
  const THINK_JITTER_MS = 1200;
  const DONE_STAGGER_MS = 250;  // 결과 도착 후 판사별 done 방송 간격

  // 1) 모든 판사 thinking 시작 방송 (stagger) + 같은 시점에 백그라운드로 단일 API 호출 시작
  const judgePromise = evaluateAllJudgesAtOnce(submission, questionTitle).catch((err) => err);

  const startTimes = {};
  for (let i = 0; i < JUDGES.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, START_STAGGER_MS));
    const judge = JUDGES[i];
    startTimes[judge.id] = Date.now();
    onJudgeStart?.(judge);
  }

  // 2) API 응답 대기
  const apiResult = await judgePromise;
  const apiFailed = apiResult instanceof Error;

  // 3) 결과를 판사별로 stagger 방송 — 동시에 done되지 않도록 + MIN_THINK_MS 보장
  const results = {};
  for (let i = 0; i < JUDGES.length; i++) {
    const judge = JUDGES[i];
    const startedAt = startTimes[judge.id];
    const minDoneAt = startedAt + MIN_THINK_MS + Math.random() * THINK_JITTER_MS + i * DONE_STAGGER_MS;

    if (apiFailed) {
      results[judge.id] = {
        judgeId: judge.id,
        judgeName: judge.name,
        score: 0,
        comment: `심사 중 오류: ${apiResult.message}`,
        highlight: '',
        error: true,
      };
    } else {
      results[judge.id] = apiResult[judge.id];
    }

    const waitMs = minDoneAt - Date.now();
    if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
    onJudgeComplete?.(judge.id, results[judge.id]);
  }

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

  // 결정적 정렬 — 동점 시 계산마다 순위가 달라지는 것을 방지. 타이브레이커:
  //   1) avgScore 내림차순
  //   2) 최고 점수(best judge score) 내림차순 — 더 인상적 심사 받은 쪽 우선
  //   3) 이름 가나다/알파벳 오름차순 — 완전 동점이어도 결정적
  const topJudgeScore = (entry) => {
    const scores = Object.values(entry.results).filter(r => !r.error).map(r => r.score || 0);
    return scores.length ? Math.max(...scores) : 0;
  };
  const sorted = [...valid].sort((a, b) => {
    const avgDiff = b.summary.avgScore - a.summary.avgScore;
    if (avgDiff !== 0) return avgDiff;
    const topDiff = topJudgeScore(b) - topJudgeScore(a);
    if (topDiff !== 0) return topDiff;
    return (a.name || '').localeCompare(b.name || '');
  });
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
