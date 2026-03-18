import { useState } from 'react';
import { motion } from 'framer-motion';

const ADMIN_PASSWORD = 'shotshot';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('shotshot_admin', 'true');
      onLogin();
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6 w-full max-w-sm px-4 relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="text-5xl mb-3">🏓</div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Pinggo Admin
          </h1>
          <p className="text-white/30 text-sm">관리자 로그인</p>
        </div>

        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="비밀번호를 입력하세요"
          className="w-full px-5 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-white placeholder-white/25 text-center text-lg focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
          autoFocus
        />

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm text-center"
          >
            비밀번호가 틀렸습니다
          </motion.p>
        )}

        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-lg shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 hover:from-violet-500 hover:to-indigo-500 transition-all"
        >
          로그인
        </motion.button>
      </motion.form>
    </div>
  );
}
