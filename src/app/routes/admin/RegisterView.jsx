import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, UserPlus, ArrowRight } from 'lucide-react';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { hashPassword, generateId } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import PickMascot from '@/components/ui/PickMascot';

const inputClass = (hasError) =>
  `w-full bg-white dark:bg-slate-700 border rounded-lg px-4 py-3 text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 ${
    hasError
      ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
      : 'border-slate-200 dark:border-slate-600 focus:ring-indigo-500/20 focus:border-indigo-500'
  }`;

export default function RegisterView({ onLogin, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmedUsername = username.trim();
    const trimmedName = displayName.trim();

    if (!trimmedUsername || !password || !trimmedName) {
      setError('모든 항목을 입력해주세요');
      return;
    }
    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      setError('아이디는 2~20자로 입력해주세요');
      return;
    }
    if (password.length < 4) {
      setError('비밀번호는 4자 이상 입력해주세요');
      return;
    }
    if (trimmedName.length > 20) {
      setError('이름은 20자 이내로 입력해주세요');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const adminsSnap = await get(ref(db, 'admins'));
      const admins = adminsSnap.val() || {};
      const existingAdmins = Object.values(admins);

      const duplicate = existingAdmins.find((a) => a.username === trimmedUsername);
      if (duplicate) {
        setError('이미 사용 중인 아이디입니다');
        setSubmitting(false);
        return;
      }

      const isFirstUser = existingAdmins.length === 0;
      const uid = generateId();
      const pwHash = await hashPassword(password);

      const adminData = {
        username: trimmedUsername,
        passwordHash: pwHash,
        displayName: trimmedName,
        role: isFirstUser ? 'master' : 'admin',
        approved: isFirstUser,
        createdAt: Date.now(),
      };

      await set(ref(db, `admins/${uid}`), adminData);

      if (isFirstUser) {
        sessionStorage.setItem('pinggo_admin',
          JSON.stringify({ uid, username: trimmedUsername, displayName: trimmedName, role: 'master' }));
        onLogin();
      } else {
        setSuccess(true);
      }
    } catch {
      setError('가입 중 오류가 발생했습니다');
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }} className="w-full max-w-sm">
        <Card className="p-8 space-y-5 overflow-visible">
          <motion.div className="flex justify-center -mt-20 mb-2"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
            <PickMascot size="lg" />
          </motion.div>
          <div className="text-center space-y-3">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.2 }}
              className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto">
              <UserPlus size={24} className="text-slate-600 dark:text-slate-300" />
            </motion.div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">가입 완료!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              관리자 승인 후 이용 가능합니다.<br />잠시만 기다려주세요.
            </p>
          </div>
          <Button type="button" variant="secondary" size="lg" className="w-full" onClick={onSwitchToLogin}>
            <ArrowRight size={18} />로그인으로 돌아가기
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.form key="register" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onSubmit={handleSubmit} className="w-full max-w-sm">
      <Card className="p-8 space-y-5 overflow-visible">
        <motion.div className="flex justify-center -mt-20 mb-2"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
          <PickMascot size="lg" />
        </motion.div>

        <motion.div className="text-center space-y-1"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Pick</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">관리자 회원가입</p>
        </motion.div>

        <motion.div className="space-y-3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}>
          <input type="text" value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            placeholder="아이디" aria-label="아이디"
            className={inputClass(!!error)}
            autoComplete="username" autoFocus />
          <input type="password" value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="비밀번호" aria-label="비밀번호"
            className={inputClass(!!error)}
            autoComplete="new-password" />
          <input type="text" value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
            placeholder="이름" aria-label="이름"
            className={inputClass(!!error)}
            autoComplete="name" />

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
            <UserPlus size={18} />{submitting ? '가입 중...' : '회원가입'}
          </Button>
        </motion.div>

        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}>
          <button type="button" onClick={onSwitchToLogin}
            className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150">
            이미 계정이 있으신가요? <span className="font-medium text-slate-700 dark:text-slate-200">로그인</span>
          </button>
        </motion.div>
      </Card>
    </motion.form>
  );
}
