import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radio, AlertCircle, LogIn } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

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
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4">
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        onSubmit={handleSubmit}
        className="w-full max-w-sm"
      >
        <Card className="p-8 space-y-6">
          <div className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
              className="flex justify-center"
            >
              <Radio size={28} className="text-indigo-500" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pinggo</h1>
              <p className="text-slate-400 text-sm mt-1">관리자 로그인</p>
            </div>
          </div>

          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              placeholder="비밀번호를 입력하세요"
              className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-base text-center placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:bg-white transition-all ${
                error
                  ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                  : 'border-slate-200 focus:ring-slate-900/10 focus:border-slate-400'
              }`}
              autoFocus
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center flex items-center justify-center gap-1.5"
              >
                <AlertCircle size={14} />
                비밀번호가 틀렸습니다
              </motion.p>
            )}
          </div>

          <Button type="submit" variant="primary" size="lg" className="w-full">
            <LogIn size={18} />
            로그인
          </Button>
        </Card>
      </motion.form>
    </div>
  );
}
