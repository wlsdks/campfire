import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, LogIn, UserPlus, ArrowRight } from 'lucide-react';
import { ref, get, set } from 'firebase/database';
import { db } from '@/lib/firebase';
import { hashPassword, generateId } from '@/lib/auth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

function PinggoMascot() {
  return (
    <motion.svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      initial={{ y: 0 }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* Body */}
      <motion.circle
        cx="60"
        cy="68"
        r="32"
        fill="#4F46E5"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
      />

      {/* Face highlight */}
      <motion.ellipse
        cx="60"
        cy="62"
        rx="24"
        ry="20"
        fill="#818CF8"
        opacity="0.3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.3 }}
      />

      {/* Left eye */}
      <motion.ellipse
        cx="50"
        cy="65"
        rx="4"
        ry="4.5"
        fill="white"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />

      {/* Right eye */}
      <motion.ellipse
        cx="70"
        cy="65"
        rx="4"
        ry="4.5"
        fill="white"
        initial={{ scaleY: 1 }}
        animate={{ scaleY: [1, 1, 0.1, 1, 1] }}
        transition={{ duration: 4, repeat: Infinity, times: [0, 0.45, 0.5, 0.55, 1] }}
      />

      {/* Smile */}
      <motion.path
        d="M52 76 Q60 82 68 76"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      />

      {/* Antenna stick */}
      <motion.line
        x1="60"
        y1="36"
        x2="60"
        y2="24"
        stroke="#4F46E5"
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.4 }}
        style={{ transformOrigin: '60px 36px' }}
      />

      {/* Antenna ball */}
      <motion.circle
        cx="60"
        cy="21"
        r="5"
        fill="#06B6D4"
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />

      {/* Signal wave 1 */}
      <motion.path
        d="M76 18 Q82 10 76 2"
        stroke="#06B6D4"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: [0, 0.6, 0], pathLength: [0, 1, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
      />

      {/* Signal wave 2 */}
      <motion.path
        d="M84 22 Q92 10 84 -2"
        stroke="#06B6D4"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        initial={{ opacity: 0, pathLength: 0 }}
        animate={{ opacity: [0, 0.4, 0], pathLength: [0, 1, 1] }}
        transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
      />

      {/* Left cheek blush */}
      <motion.circle
        cx="43"
        cy="74"
        r="5"
        fill="#EC4899"
        opacity="0.2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7 }}
      />

      {/* Right cheek blush */}
      <motion.circle
        cx="77"
        cy="74"
        r="5"
        fill="#EC4899"
        opacity="0.2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.7 }}
      />
    </motion.svg>
  );
}

const inputClass = (hasError, isFocused) =>
  `w-full bg-slate-50 border-2 rounded-xl px-4 py-3.5 text-base placeholder:text-slate-300 focus:outline-none focus:bg-white transition-all duration-200 ${
    hasError
      ? 'border-red-300 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
      : isFocused
        ? 'border-indigo-400 shadow-[0_0_0_3px_rgba(79,70,229,0.1)]'
        : 'border-slate-200'
  }`;

function LoginView({ onLogin, onSwitchToRegister }) {
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
      <Card className="p-8 space-y-5 overflow-visible">
        {/* Mascot */}
        <motion.div
          className="flex justify-center -mt-20 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <PinggoMascot />
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center space-y-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pinggo</h1>
          <p className="text-slate-400 text-sm">관리자 로그인</p>
        </motion.div>

        {/* Inputs */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
            placeholder="아이디"
            className={inputClass(!!error, focusedField === 'username')}
            autoComplete="username"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            placeholder="비밀번호"
            className={inputClass(!!error, focusedField === 'password')}
            autoComplete="current-password"
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                className="text-red-500 text-sm text-center flex items-center justify-center gap-1.5"
              >
                <AlertCircle size={14} />
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
            <LogIn size={18} />
            {submitting ? '로그인 중...' : '로그인'}
          </Button>
        </motion.div>

        {/* Switch to register */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            계정이 없으신가요? <span className="font-medium text-slate-700">회원가입</span>
          </button>
        </motion.div>
      </Card>
    </motion.form>
  );
}

function RegisterView({ onLogin, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

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

      // Check username uniqueness
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
        // Auto-login for first (master) user
        sessionStorage.setItem(
          'pinggo_admin',
          JSON.stringify({
            uid,
            username: trimmedUsername,
            displayName: trimmedName,
            role: 'master',
          })
        );
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
      <motion.div
        key="success"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-sm"
      >
        <Card className="p-8 space-y-5 overflow-visible">
          <motion.div
            className="flex justify-center -mt-20 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          >
            <PinggoMascot />
          </motion.div>

          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto"
            >
              <UserPlus size={24} className="text-slate-600" />
            </motion.div>
            <h2 className="text-xl font-bold text-slate-900">가입 완료!</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              관리자 승인 후 이용 가능합니다.
              <br />
              잠시만 기다려주세요.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onSwitchToLogin}
          >
            <ArrowRight size={18} />
            로그인으로 돌아가기
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.form
      key="register"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      onSubmit={handleSubmit}
      className="w-full max-w-sm"
    >
      <Card className="p-8 space-y-5 overflow-visible">
        {/* Mascot */}
        <motion.div
          className="flex justify-center -mt-20 mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <PinggoMascot />
        </motion.div>

        {/* Title */}
        <motion.div
          className="text-center space-y-1"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pinggo</h1>
          <p className="text-slate-400 text-sm">관리자 회원가입</p>
        </motion.div>

        {/* Inputs */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError(''); }}
            onFocus={() => setFocusedField('username')}
            onBlur={() => setFocusedField(null)}
            placeholder="아이디"
            className={inputClass(!!error, focusedField === 'username')}
            autoComplete="username"
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onFocus={() => setFocusedField('password')}
            onBlur={() => setFocusedField(null)}
            placeholder="비밀번호"
            className={inputClass(!!error, focusedField === 'password')}
            autoComplete="new-password"
          />
          <input
            type="text"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setError(''); }}
            onFocus={() => setFocusedField('displayName')}
            onBlur={() => setFocusedField(null)}
            placeholder="이름"
            className={inputClass(!!error, focusedField === 'displayName')}
            autoComplete="name"
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                className="text-red-500 text-sm text-center flex items-center justify-center gap-1.5"
              >
                <AlertCircle size={14} />
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
            <UserPlus size={18} />
            {submitting ? '가입 중...' : '회원가입'}
          </Button>
        </motion.div>

        {/* Switch to login */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            이미 계정이 있으신가요? <span className="font-medium text-slate-700">로그인</span>
          </button>
        </motion.div>
      </Card>
    </motion.form>
  );
}

export default function AdminLogin({ onLogin }) {
  const [view, setView] = useState('login');

  return (
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {view === 'login' ? (
          <LoginView
            key="login"
            onLogin={onLogin}
            onSwitchToRegister={() => setView('register')}
          />
        ) : (
          <RegisterView
            key="register"
            onLogin={onLogin}
            onSwitchToLogin={() => setView('login')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
