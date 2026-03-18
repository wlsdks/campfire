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
    <div className="min-h-dvh bg-gray-950 flex items-center justify-center">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-4 w-full max-w-xs"
      >
        <h1 className="text-2xl font-bold text-white text-center">Admin</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="비밀번호"
          className="w-full px-4 py-3 rounded-xl bg-gray-800 text-white placeholder-white/30 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
        {error && <p className="text-red-400 text-sm text-center">비밀번호가 틀렸습니다</p>}
        <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold">
          로그인
        </button>
      </motion.form>
    </div>
  );
}
