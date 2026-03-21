import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, LogIn } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { hashPassword } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PickMascot from '@/components/ui/PickMascot';

const inputClass = (hasError, isFocused) =>
  `w-full bg-slate-50 dark:bg-slate-700 border-2 rounded-xl px-4 py-4 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-600 transition-all duration-200 ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
      : isFocused
        ? 'border-slate-400 shadow-[0_0_0_3px_rgba(15,23,42,0.06)]'
        : 'border-slate-200 dark:border-slate-600'
  }`;

export default function LoginView({ onLogin, onSwitchToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('아이디와 비밀번호를 입력해주세요');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const adminsSnap = await get(ref(db, 'admins'));
      const admins = adminsSnap.val() || {};

      const pwHash = await hashPassword(password);
      const entry = Object.entries(admins).find(
        ([, admin]) => admin.username === username.trim() && admin.passwordHash === pwHash
      );

      if (!entry) {
        setError('아이디 또는 비밀번호가 틀렸습니다');
        setSubmitting(false);
        return;
      }

      const [uid, admin] = entry;

      if (!admin.approved) {
        setError('관리자 승인 대기 중입니다');
        setSubmitting(false);
        return;
      }

      sessionStorage.setItem(
        'pinggo_admin',
        JSON.stringify({
          uid,
          username: admin.username,
          displayName: admin.displayName || admin.username,
          role: admin.role,
        })
      );
      onLogin();
    } catch {
      setError('로그인 중 오류가 발생했습니다');
      setSubmitting(false);
    }
  }

  return (
    <motion.form
      key="login"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onSubmit={handleSubmit}
      className="w-full max-w-sm"
    >
      <Card className="p-10 space-y-6 overflow-visible">
        <motion.div className="flex justify-center -mt-20 mb-4"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
          <PickMascot size="lg" />
        </motion.div>

        <motion.div className="text-center space-y-1.5"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Pick</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">관리자 로그인</p>
        </motion.div>

        <motion.div className="space-y-4"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}>
          <input type="text" value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            onFocus={() => setFocusedField('username')} onBlur={() => setFocusedField(null)}
            placeholder="아이디" aria-label="아이디"
            className={inputClass(!!error, focusedField === 'username')}
            autoComplete="username" autoFocus />
          <input type="password" value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
            placeholder="비밀번호" aria-label="비밀번호"
            className={inputClass(!!error, focusedField === 'password')}
            autoComplete="current-password" />

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                className="text-red-500 text-sm text-center flex items-center justify-center gap-1.5" role="alert">
                <AlertCircle size={14} />{error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}>
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
            <LogIn size={18} />{submitting ? '로그인 중...' : '로그인'}
          </Button>
        </motion.div>

        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}>
          <button type="button" onClick={onSwitchToRegister}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors duration-150">
            계정이 없으신가요? <span className="font-medium text-slate-700 dark:text-slate-200">회원가입</span>
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.7 }}>
          <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
            <button type="button"
              onClick={async () => {
                setSubmitting(true);
                setError('');
                try {
                  sessionStorage.setItem('pinggo_admin',
                    JSON.stringify({ uid: 'demo', username: 'demo', displayName: '데모 사용자', role: 'admin' }));
                  onLogin();
                } catch {
                  setError('데모 로그인에 실패했습니다');
                  setSubmitting(false);
                }
              }}
              className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors duration-150"
              disabled={submitting}>
              강사 데모로 둘러보기
            </button>
            <button type="button"
              onClick={async () => {
                setSubmitting(true);
                setError('');
                try {
                  sessionStorage.setItem('pinggo_admin',
                    JSON.stringify({ uid: 'staff_demo', username: 'staff_demo', displayName: '데모 스태프', role: 'staff' }));
                  onLogin();
                } catch {
                  setError('데모 로그인에 실패했습니다');
                  setSubmitting(false);
                }
              }}
              className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-600 transition-colors duration-150"
              disabled={submitting}>
              스태프 데모로 둘러보기
            </button>
          </div>
        </motion.div>
      </Card>
    </motion.form>
  );
}
