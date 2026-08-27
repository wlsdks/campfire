/**
 * 발표 화면에 끼워 넣을 웹페이지 주소 검증.
 *
 * 정책이 기술보다 먼저다.
 * - 사이트가 X-Frame-Options나 CSP frame-ancestors로 임베드를 거부하면 그건 그 사이트의
 *   명시적 의사표시다. 우회하지 않는다(헤더를 벗기는 프록시 같은 건 만들지 않는다).
 *   거부하는 곳은 브라우저가 알아서 막고, 우리는 새 창으로 내보낸다.
 * - http/https만 받는다. javascript:, data:, file: 등은 전부 거른다.
 * - 우리 앱 자신은 넣지 못하게 막는다. 같은 출처를 iframe에 넣으면 sandbox의
 *   allow-same-origin과 맞물려 임베드된 문서가 우리 앱의 저장소·DOM에 접근할 수 있다.
 */

/** iframe에 걸 sandbox 권한. 최상위 창 탈취(allow-top-navigation)는 주지 않는다. */
export const EMBED_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox';

/** 카메라·마이크·위치 등은 임베드 페이지에 넘기지 않는다. */
export const EMBED_ALLOW = '';

export const EMBED_REJECT = {
  EMPTY: 'empty',
  SCHEME: 'scheme',
  SELF: 'self',
  MALFORMED: 'malformed',
};

const REJECT_MESSAGE = {
  [EMBED_REJECT.EMPTY]: '주소를 입력해주세요.',
  [EMBED_REJECT.SCHEME]: 'http:// 또는 https:// 로 시작하는 주소만 넣을 수 있어요.',
  [EMBED_REJECT.SELF]: '이 앱 자신의 주소는 넣을 수 없어요.',
  [EMBED_REJECT.MALFORMED]: '주소 형식을 다시 확인해주세요.',
};

export function embedRejectMessage(reason) {
  return REJECT_MESSAGE[reason] || REJECT_MESSAGE[EMBED_REJECT.MALFORMED];
}

/**
 * 입력한 주소를 임베드해도 되는 형태로 정규화한다.
 *
 * @param {string} raw 사용자가 입력한 주소. 스킴이 없으면 https를 붙여 해석한다.
 * @param {{ selfOrigin?: string }} [opts] 같은 출처 판정 기준(테스트에서 주입)
 * @returns {{ url: string|null, reason: string|null }}
 */
export function safeEmbedUrl(raw, opts = {}) {
  const input = (raw || '').trim();
  if (!input) return { url: null, reason: EMBED_REJECT.EMPTY };

  // 스킴을 안 쓰는 입력("example.com")은 https로 읽는다. 단 다른 스킴을 적었다면 존중한다.
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input) ? input : `https://${input}`;

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    return { url: null, reason: EMBED_REJECT.MALFORMED };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { url: null, reason: EMBED_REJECT.SCHEME };
  }
  if (!parsed.hostname) return { url: null, reason: EMBED_REJECT.MALFORMED };

  const selfOrigin = opts.selfOrigin
    ?? (typeof window !== 'undefined' ? window.location.origin : null);
  if (selfOrigin && parsed.origin === selfOrigin) {
    return { url: null, reason: EMBED_REJECT.SELF };
  }

  return { url: parsed.toString(), reason: null };
}

/** 화면에 짧게 보여줄 주소. 프로토콜과 끝 슬래시를 떼어 읽기 좋게 만든다. */
export function embedDisplayUrl(url) {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === '/' ? '' : parsed.pathname;
    return `${parsed.hostname}${path}${parsed.search}`;
  } catch {
    return url || '';
  }
}
