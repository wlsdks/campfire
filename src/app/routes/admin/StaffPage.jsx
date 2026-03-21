import { useState } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import { ArrowLeft, MessageCircle, Hand, MessageSquare, Users } from 'lucide-react';
import { useParticipants } from '@/features/participants/api/useParticipants';
import Badge from '@/components/ui/Badge';
import StaffQuestionsTab from './staff/StaffQuestionsTab';
import StaffHandRaisesTab from './staff/StaffHandRaisesTab';
import StaffChatTab from './staff/StaffChatTab';
import StaffParticipantsTab from './staff/StaffParticipantsTab';

const TABS = [
  { key: 'questions', label: '질문', icon: MessageCircle },
  { key: 'handRaise', label: '손들기', icon: Hand },
  { key: 'chat', label: '채팅', icon: MessageSquare },
  { key: 'participants', label: '참여자', icon: Users },
];

export default function StaffPage({ sessionId, session, adminUser, onBack }) {
  const [activeTab, setActiveTab] = useState('questions');
  const { count } = useParticipants(sessionId);
  const courseName = session?.courseName || 'Pick';
  const round = session?.roundNumber ? `${session.roundNumber}차` : '';

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-all"
          aria-label="뒤로가기"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
              {courseName}
            </h1>
            {round && (
              <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{round}</span>
            )}
            <Badge variant="neutral">스태프</Badge>
          </div>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
          <Users size={12} className="inline mr-1" />
          {count}
        </span>
      </header>

      {/* Tab bar */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 pt-2 pb-0 shrink-0">
        <LayoutGroup>
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 active:scale-[0.97] ${
                    isActive
                      ? 'text-white dark:text-slate-900'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="staff-tab-indicator"
                      className="absolute inset-0 bg-slate-900 dark:bg-slate-100 rounded-lg"
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    />
                  )}
                  <Icon size={14} className="relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      {/* Tab content */}
      <div className={`flex-1 overflow-y-auto px-4 py-4 ${activeTab === 'chat' ? 'flex flex-col min-h-0 overflow-hidden' : ''}`}>
        {activeTab === 'questions' && <StaffQuestionsTab sessionId={sessionId} />}
        {activeTab === 'handRaise' && <StaffHandRaisesTab sessionId={sessionId} />}
        {activeTab === 'chat' && (
          <StaffChatTab sessionId={sessionId} senderName={adminUser?.displayName || '스태프'} />
        )}
        {activeTab === 'participants' && <StaffParticipantsTab sessionId={sessionId} />}
      </div>
    </div>
  );
}
