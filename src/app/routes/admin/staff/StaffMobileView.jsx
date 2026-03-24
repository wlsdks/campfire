import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Hand, MessageSquare, Users, LogOut } from 'lucide-react';
import { useParticipants } from '@/features/participants/api/useParticipants';
import Badge from '@/components/ui/Badge';
import StaffDMAlert from '@/features/dm/components/StaffDMAlert';
import StaffQuestionsTab from './StaffQuestionsTab';
import StaffHandRaisesTab from './StaffHandRaisesTab';
import StaffChatTab from './StaffChatTab';
import StaffParticipantsTab from './StaffParticipantsTab';

const TABS = [
  { key: 'questions', label: '질문', icon: MessageCircle },
  { key: 'handRaise', label: '손들기', icon: Hand },
  { key: 'chat', label: '채팅', icon: MessageSquare },
  { key: 'participants', label: '참여자', icon: Users },
];

export default function StaffMobileView({ sessionId, session, adminUser, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('questions');
  const { count } = useParticipants(sessionId);
  const courseName = session?.courseName || 'Pick';
  const round = session?.roundNumber ? `${session.roundNumber}차` : '';

  return (
    <div className="h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col overflow-hidden">
      {/* DM alerts for help requests */}
      <StaffDMAlert
        sessionId={sessionId}
        staffId={adminUser?.uid}
        staffName={adminUser?.displayName || '스태프'}
        senderType="staff"
      />

      {/* Header — mobile app style (no border, backdrop blur) */}
      <header className="bg-white dark:bg-slate-800 shrink-0">
        <div className="flex items-center gap-3 px-5 py-3.5">
          <button onClick={activeTab !== 'questions' ? () => setActiveTab('questions') : onBack}
            className="p-2 -ml-2 rounded-xl text-slate-400 active:bg-slate-100 dark:active:bg-slate-700 transition-colors duration-150"
            aria-label="뒤로가기">
            <ArrowLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
              {courseName} {round}
            </h1>
            <div className="flex items-center gap-1.5 text-[13px] text-slate-400">
              <span><motion.span key={count} initial={{ scale: 1.15 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 22 }} className="inline-block tabular-nums">{count}</motion.span>명 접속</span>
              <span>·</span>
              <span>스태프</span>
            </div>
          </div>
          {onLogout && (
            <button onClick={onLogout}
              className="p-2 rounded-xl text-slate-400 active:bg-slate-100 dark:active:bg-slate-700 transition-colors duration-150"
              aria-label="로그아웃">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        <div className={`h-full ${activeTab === 'chat' ? 'flex flex-col' : 'overflow-y-auto overscroll-contain scrollbar-hide'}`}>
          <div className={`w-full min-h-full ${activeTab === 'chat' ? 'flex-1 flex flex-col min-h-0' : 'px-5 py-5 space-y-4 flex flex-col'}`}>
            {activeTab === 'questions' && <StaffQuestionsTab sessionId={sessionId} adminUser={adminUser} />}
            {activeTab === 'handRaise' && <StaffHandRaisesTab sessionId={sessionId} />}
            {activeTab === 'chat' && (
              <StaffChatTab sessionId={sessionId} senderName={adminUser?.displayName || '스태프'} />
            )}
            {activeTab === 'participants' && <StaffParticipantsTab sessionId={sessionId} />}
          </div>
        </div>
      </div>

      {/* Bottom tab bar (same pattern as instructor mobile) */}
      <div className="flex bg-white dark:bg-slate-800 shrink-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <motion.button
              key={tab.key}
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors duration-150 ${
                isActive
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2 : 1.5} />
              <span>{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
