import { useState } from 'react';
import { HelpCircle, Send, CheckCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const MAX_LENGTH = 200;

export default function HelpRequestModal({ open, onClose, onSubmit }) {
  const [text, setText] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    const success = await onSubmit(text.trim());
    setSending(false);
    if (success) {
      setText('');
      setSent(true);
      setTimeout(() => {
        setSent(false);
        onClose();
      }, 1500);
    }
  }

  function handleClose() {
    if (!sent) {
      setText('');
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={handleClose} ariaLabel="도움 요청">
      {sent ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle size={32} className="text-emerald-500" />
          <p className="text-slate-900 dark:text-slate-100 font-bold text-lg">
            도움 요청이 전송되었습니다
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">스태프가 곧 응답합니다</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center space-y-1">
            <HelpCircle size={24} className="text-slate-900 dark:text-slate-100 mx-auto mb-2" />
            <p className="text-slate-900 dark:text-slate-100 font-bold text-lg">도움 요청</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs">스태프에게 1:1 도움을 요청합니다</p>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="어떤 도움이 필요하신가요?"
            aria-label="도움 요청 내용"
            maxLength={MAX_LENGTH}
            rows={3}
            className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-4 py-3 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-all"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 tabular-nums">
              {text.length}/{MAX_LENGTH}
            </span>
            <Button type="submit" variant="primary" size="md" disabled={!text.trim() || sending}>
              <Send size={16} />
              보내기
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
