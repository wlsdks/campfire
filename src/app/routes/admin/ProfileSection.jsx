import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import Button from '@/components/ui/Button';
import { User, Check, AlertCircle } from 'lucide-react';

const itemVariant = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

export default function ProfileSection({ adminUser }) {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(adminUser?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    const trimmed = displayName.trim();
    if (!trimmed || trimmed.length > 20) { setError('이름은 1~20자로 입력해주세요'); return; }
    if (trimmed === adminUser?.displayName) { setEditing(false); return; }
    if (adminUser?.uid === 'demo') { setError('데모 계정은 수정할 수 없습니다'); return; }
    setSaving(true); setError('');
    try {
      await update(ref(db, `admins/${adminUser.uid}`), { displayName: trimmed });
      const stored = JSON.parse(sessionStorage.getItem('pinggo_admin') || '{}');
      stored.displayName = trimmed;
      sessionStorage.setItem('pinggo_admin', JSON.stringify(stored));
      setSaved(true); setEditing(false);
      setTimeout(() => setSaved(false), 2000);
    } catch { setError('저장에 실패했습니다'); }
    finally { setSaving(false); }
  }

  const cancelEdit = () => { setEditing(false); setDisplayName(adminUser?.displayName || ''); setError(''); };

  return (
    <motion.div variants={itemVariant} className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-5">
        <User size={18} className="text-slate-400" />
        <h3 className="text-sm font-bold text-slate-900">프로필</h3>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1.5">아이디</label>
          <p className="text-sm text-slate-600 font-medium">{adminUser?.username || '—'}</p>
        </div>
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1.5">표시 이름</label>
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-2">
                <input type="text" value={displayName} onChange={(e) => { setDisplayName(e.target.value); setError(''); }} maxLength={20}
                  className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3 text-sm placeholder:text-slate-300 focus:outline-none focus:bg-white transition-all duration-200 ${error ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-slate-400 focus:shadow-[0_0_0_3px_rgba(15,23,42,0.06)]'}`}
                  aria-label="표시 이름" autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') cancelEdit(); }} />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">{displayName.length}/20</span>
                  <div className="flex gap-2">
                    <button onClick={cancelEdit} className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-3 py-1.5">취소</button>
                    <Button onClick={handleSave} variant="primary" size="sm" disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
                  </div>
                </div>
                {error && <p className="text-xs text-red-500 flex items-center gap-1" role="alert"><AlertCircle size={12} />{error}</p>}
              </motion.div>
            ) : (
              <motion.div key="display" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="flex items-center gap-3">
                <p className="text-sm text-slate-700 font-medium flex-1">{adminUser?.displayName || '—'}</p>
                <button onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-slate-700 transition-colors px-2.5 py-1 rounded-lg hover:bg-slate-50">수정</button>
                <AnimatePresence>
                  {saved && <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="text-xs text-emerald-600 flex items-center gap-0.5"><Check size={12} />저장됨</motion.span>}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1.5">역할</label>
          <p className="text-sm text-slate-600 font-medium">{adminUser?.role === 'master' ? '마스터 관리자' : '강사'}</p>
        </div>
      </div>
    </motion.div>
  );
}
