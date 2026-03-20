import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import LoginView from './LoginView';
import RegisterView from './RegisterView';

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
