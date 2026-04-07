import { Component } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import PickMascot from '@/components/ui/PickMascot';

/**
 * React Error Boundary — catches render errors and shows a recovery UI.
 *
 * Props:
 * @param {string}  scope     — label for the boundary (e.g. "student", "admin")
 * @param {boolean} fullPage  — true → min-h-dvh centered layout (default: true)
 * @param {React.ReactNode} children
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error(`[ErrorBoundary:${this.props.scope || 'app'}]`, error, errorInfo);
    // Dynamic import 실패 시 자동 새로고침 (배포 후 캐시 불일치)
    if (error?.message?.includes('dynamically imported module') || error?.message?.includes('Failed to fetch')) {
      window.location.reload();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const fullPage = this.props.fullPage !== false;

    return <ErrorFallback
      fullPage={fullPage}
      errorMessage={this.state.error?.message}
      onRetry={this.handleRetry}
      onReload={this.handleReload}
    />;
  }
}

/** Functional fallback UI — clean, minimal, Korean. */
function ErrorFallback({ fullPage, errorMessage, onRetry, onReload }) {
  const wrapperClass = fullPage
    ? 'min-h-dvh bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6'
    : 'flex items-center justify-center p-8';

  return (
    <div className={wrapperClass}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center max-w-sm"
      >
        {/* Mascot */}
        <div className="flex justify-center mb-4">
          <PickMascot size="md" mood="thinking" />
        </div>

        {/* Message */}
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
          문제가 발생했습니다
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          일시적인 오류가 발생했어요. 다시 시도해 주세요.
        </p>

        {/* Error detail (dev only — collapsed) */}
        {errorMessage && (
          <details className="mb-6 text-left">
            <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-500 transition-colors duration-150">
              오류 상세
            </summary>
            <pre className="mt-2 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-words">
              {errorMessage}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-medium py-2.5 px-5 rounded-lg transition-colors duration-150 text-sm"
          >
            <RefreshCw size={15} />
            다시 시도
          </button>
          <button
            onClick={onReload}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium py-2.5 px-5 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors duration-150 text-sm"
          >
            페이지 새로고침
          </button>
        </div>
      </motion.div>
    </div>
  );
}
