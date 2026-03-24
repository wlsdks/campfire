import { useState } from 'react';
import { lookupSubmission } from '@/features/assignments/api/useSubmissions';
import Button from '@/components/ui/Button';

// ─── LookupForm ────────────────────────────────────
export default function LookupForm({ assignmentId, onFound }) {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLookup() {
    if (!name.trim() || pin.length !== 4) return;
    setLoading(true);
    setError('');
    try {
      const result = await lookupSubmission(assignmentId, name.trim(), pin);
      if (result.error === 'NOT_FOUND') setError('해당 이름의 제출물을 찾을 수 없습니다');
      else if (result.error === 'PIN_MISMATCH') setError('비밀번호가 일치하지 않습니다');
      else onFound(result.submission);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">이름</p>
        <input type="text" value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="제출 시 입력한 이름"
          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          autoFocus
        />
      </div>
      <div>
        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mb-2">비밀번호</p>
        <input type="password" inputMode="numeric" pattern="[0-9]*" value={pin}
          onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
          placeholder="••••" maxLength={4}
          onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
          className={`w-full bg-white dark:bg-slate-800 border rounded-xl px-4 py-3.5 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all tracking-[0.3em] ${
            error ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <Button onClick={handleLookup} variant="primary" size="lg" disabled={!name.trim() || pin.length !== 4 || loading} className="w-full">
        {loading ? '조회 중...' : '조회하기'}
      </Button>
    </div>
  );
}
