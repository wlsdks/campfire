/**
 * Gemini 클라이언트 — 모든 AI 기능의 단일 진입점.
 *
 * 실제 API 키는 이 코드가 아니라 Cloud Function 프록시(functions/index.js)의
 * Secret Manager 시크릿으로만 존재한다. 브라우저 번들에 들어가는 건 프록시 경로뿐이다.
 * 키를 `VITE_` 환경변수로 두면 Vite가 빌드 타임에 공개 JS로 인라인해버린다 —
 * 2026-07-02에 정확히 그렇게 유출됐다.
 *
 * 절대 이 파일에 API 키를 되돌려놓지 말 것. 자세한 배경은 functions/index.js 상단 참조.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * 프록시는 Hosting rewrite로 앱과 같은 출처에 붙는다(`/api/gemini/**` → geminiProxy).
 * 그래서 기본값은 상대 경로이고, CORS가 필요 없다.
 * 다른 곳에 띄운 프록시를 쓰려면 VITE_GEMINI_PROXY_URL로 덮어쓴다.
 */
const PROXY_URL = (import.meta.env.VITE_GEMINI_PROXY_URL || '/api/gemini').replace(/\/$/, '');

/**
 * SDK는 apiKey를 `x-goog-api-key` 헤더에 실어 보낸다. 프록시가 그 헤더를 버리고
 * 서버 시크릿으로 교체하므로, 여기 값은 아무 의미 없는 자리표시자다.
 */
const PLACEHOLDER_KEY = 'proxied-no-key-in-client';

/**
 * AI 기능 임시 중단 스위치.
 *
 * 프록시 함수(geminiProxy)를 내린 상태라 실제 호출은 어차피 전부 실패한다. 그렇다고 버튼을
 * 화면에서 없애면 "있던 기능이 사라졌다"는 문의가 생기므로, UI는 그대로 두고 눌렀을 때
 * 임시 중단임을 알린다.
 *
 * 기본값이 꺼짐인 이유: 켜는 쪽이 명시적이어야 프록시 없이 배포됐을 때 조용히 실패하지 않는다.
 * 다시 켜려면 geminiProxy를 배포하고 VITE_AI_ENABLED=true 로 빌드한다.
 */
export const AI_ENABLED = import.meta.env.VITE_AI_ENABLED === 'true';
export const AI_DISABLED_MESSAGE = 'AI 기능을 임시로 꺼뒀어요. 조금 뒤에 다시 시도해주세요.';

let genAI = null;

/**
 * AI 기능 버튼의 활성/비활성 판단에 쓰인다.
 * 프록시가 같은 출처에 항상 존재하므로 true다. VITE_GEMINI_PROXY_URL을 빈 문자열로
 * 명시하면(=프록시 없는 환경) AI 기능이 숨겨진다.
 */
export function isGeminiConfigured() {
  return PROXY_URL !== '';
}

/**
 * 모델 핸들을 반환한다. 호출부는 프록시 존재를 몰라도 되고, 기존 SDK 사용법
 * (model.generateContent(...))을 그대로 유지한다.
 */
export function getGeminiModel(modelParams) {
  // 모든 AI 기능이 이 함수를 거치므로, 여기서 막으면 호출부를 하나하나 손대지 않아도 된다.
  // 각 컴포넌트는 이미 err.message를 화면에 표시하고 있어 이 문장이 그대로 사용자에게 간다.
  if (!AI_ENABLED) {
    throw new Error(AI_DISABLED_MESSAGE);
  }
  if (!PROXY_URL) {
    throw new Error('Gemini 프록시가 비활성화되어 있습니다. (VITE_GEMINI_PROXY_URL)');
  }
  if (!genAI) genAI = new GoogleGenerativeAI(PLACEHOLDER_KEY);
  return genAI.getGenerativeModel(modelParams, { baseUrl: PROXY_URL });
}
