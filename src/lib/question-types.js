import { ArrowUpDown, BarChart3, Circle, Cloud, MessageSquare, Swords, TextCursorInput, Thermometer, Trophy } from 'lucide-react';

/**
 * Canonical question type definitions.
 * Single source of truth — imported by QuestionForm, QuestionList,
 * QuestionLibraryView, ImportFromLibraryModal, CourseEditor, StatsView.
 */
export const QUESTION_TYPES = [
  { value: 'choice', label: '객관식', icon: BarChart3 },
  { value: 'quiz', label: '퀴즈', icon: Trophy },
  { value: 'ox', label: 'O/X', icon: Circle },
  { value: 'wordcloud', label: '워드클라우드', icon: Cloud },
  { value: 'qna', label: 'Q&A', icon: MessageSquare },
  { value: 'scale', label: '감정 온도계', icon: Thermometer },
  { value: 'debate', label: '찬반 토론', icon: Swords },
  { value: 'ranking', label: '순위 맞추기', icon: ArrowUpDown },
  { value: 'fillinblank', label: '빈칸 채우기', icon: TextCursorInput },
];

/**
 * Map for quick lookup by type value.
 * Returns { label, icon } for a given question type string.
 */
export const QUESTION_TYPE_MAP = Object.fromEntries(
  QUESTION_TYPES.map((t) => [t.value, { label: t.label, icon: t.icon }])
);

/** Simple label-only map for display without icons. */
export const TYPE_LABELS = Object.fromEntries(
  QUESTION_TYPES.map((t) => [t.value, t.label])
);
