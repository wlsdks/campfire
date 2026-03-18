import { useState } from 'react';
import { motion } from 'framer-motion';

const ADMIN_PASSWORD = 'pinggo';

export default function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('pinggo_admin', 'true');
      onLogin();
    } else {
      setError(true);
    }
  }

  return (
    <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm px-4"
      >
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="text-5xl mb-3">🏓</div>
            <h1 className="text-3xl font-bold text-gray-900">
              Pinggo Admin
            </h1>
            <p className="text-gray-400 text-sm">관리자 로그인</p>
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(false); }}
            placeholder="비밀번호를 입력하세요"
            className="w-full px-5 py-4 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-300 text-center text-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            autoFocus
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-rose-500 text-sm text-center"
            >
              비밀번호가 틀렸습니다
            </motion.p>
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-lg shadow-sm transition-all"
          >
            로그인
          </motion.button>
        </div>
      </motion.form>
    </div>
  );
}
