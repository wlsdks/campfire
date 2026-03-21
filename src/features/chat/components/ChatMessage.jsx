import { memo } from 'react';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const period = h < 12 ? '오전' : '오후';
  return `${period} ${h % 12 || 12}:${m}`;
}

const ChatMessage = memo(function ChatMessage({ msg, isOwn }) {
  const initial = (msg.sender || '익명').charAt(0);

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-0.5">
        <div className="px-3.5 py-2.5 text-sm leading-relaxed bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-2xl rounded-br-sm max-w-[75%]">
          {msg.text}
        </div>
        <span className="text-[10px] text-slate-300 dark:text-slate-500 px-1">{formatTime(msg.timestamp)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0 mt-0.5">
        {initial}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {msg.sender || '익명'}
          {msg.senderType === 'instructor' && (
            <span className="ml-1 text-[10px] font-semibold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">강사</span>
          )}
          {msg.senderType === 'staff' && (
            <span className="ml-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-600 px-1.5 py-0.5 rounded-full">스태프</span>
          )}
        </span>
        <div className="px-3.5 py-2.5 text-sm leading-relaxed bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl rounded-tl-sm">
          {msg.text}
        </div>
        <span className="text-[10px] text-slate-300 dark:text-slate-500 px-1">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
});

export default ChatMessage;
