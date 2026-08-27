import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Globe, ShieldAlert } from 'lucide-react';
import Button from '@/components/ui/Button';
import { EMBED_SANDBOX, EMBED_ALLOW, embedDisplayUrl, safeEmbedUrl } from '@/lib/embed';

/** 이 시간 안에 페이지가 뜨지 않으면 임베드를 거부하는 사이트로 보고 새 창 안내로 바꾼다. */
const LOAD_TIMEOUT_MS = 6000;

/**
 * 발표 화면 안에서 웹페이지를 여는 슬라이드.
 *
 * 많은 사이트가 X-Frame-Options나 CSP frame-ancestors로 임베드를 거부한다. 그건 그 사이트의
 * 결정이라 우회하지 않는다 — 대신 감지해서 "새 창에서 열기"로 안내한다.
 * 브라우저는 차단 사유를 스크립트에 알려주지 않으므로(교차 출처라 안을 들여다볼 수 없다)
 * 로드 신호가 제때 오지 않으면 차단으로 간주한다.
 */
export default function WebEmbedPresenter({ url: rawUrl, presenter = false, title }) {
  const [state, setState] = useState('loading'); // loading | ready | blocked
  const timerRef = useRef(0);

  // 저장 시점에도 검증하지만 여기서 한 번 더 본다. questions 노드는 누구나 쓸 수 있어
  // DB에 직접 심어진 값이 그대로 iframe src로 들어갈 수 있기 때문이다.
  const { url } = safeEmbedUrl(rawUrl);

  useEffect(() => {
    setState('loading');
    timerRef.current = window.setTimeout(() => setState((prev) => (prev === 'ready' ? prev : 'blocked')), LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timerRef.current);
  }, [url]);

  if (!url) return null;

  function openInNewTab() {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className={`w-full flex flex-col ${presenter ? 'gap-3' : 'gap-2'}`}>
      <div className="flex items-center gap-2 px-1">
        <Globe size={presenter ? 18 : 14} className="text-slate-400 shrink-0" />
        <span className={`text-slate-500 dark:text-slate-400 truncate ${presenter ? 'text-base' : 'text-xs'}`}>
          {embedDisplayUrl(url)}
        </span>
        <button
          onClick={openInNewTab}
          className={`ml-auto shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150 ${presenter ? 'text-sm' : 'text-xs'}`}
        >
          <ExternalLink size={presenter ? 15 : 12} />
          새 창
        </button>
      </div>

      <div
        className={`relative w-full rounded-2xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-slate-700 ${
          presenter ? 'h-[72vh]' : 'h-[60vh]'
        }`}
      >
        {state !== 'blocked' && (
          <iframe
            key={url}
            src={url}
            title={title || '웹페이지'}
            onLoad={() => setState('ready')}
            sandbox={EMBED_SANDBOX}
            allow={EMBED_ALLOW}
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 w-full h-full border-0"
          />
        )}

        {state === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 pointer-events-none">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-2 text-slate-400"
            >
              <Globe size={18} />
              <span className={presenter ? 'text-lg' : 'text-sm'}>페이지를 불러오는 중</span>
            </motion.div>
          </div>
        )}

        {state === 'blocked' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center bg-slate-50 dark:bg-slate-800">
            <ShieldAlert size={presenter ? 44 : 32} className="text-slate-300 dark:text-slate-600" />
            <div className="space-y-1.5">
              <p className={`font-bold text-slate-900 dark:text-slate-100 ${presenter ? 'text-2xl' : 'text-base'}`}>
                이 사이트는 화면 안에서 열 수 없어요
              </p>
              <p className={`text-slate-400 leading-relaxed ${presenter ? 'text-lg' : 'text-sm'}`}>
                사이트가 다른 화면에 끼워 넣는 것을 허용하지 않습니다.
                <br />
                새 창으로 열어 보여주세요.
              </p>
            </div>
            <Button onClick={openInNewTab} variant="primary" size={presenter ? 'lg' : 'md'}>
              <ExternalLink size={presenter ? 20 : 16} />
              새 창에서 열기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
