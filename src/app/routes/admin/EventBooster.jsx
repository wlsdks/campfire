import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import QuizEventBanner from '@/components/ui/QuizEventBanner';
import { QUIZ_EVENT_PRESETS } from '@/lib/quiz';

const EVENT_ACCENT = {
  idle: 'border-slate-200 bg-slate-50 hover:bg-slate-100',
  selected: 'border-slate-900 bg-slate-50 ring-1 ring-slate-300',
};

/**
 * Event booster section for arming quiz events on the next quiz question.
 * Presentational component — delegates event actions to parent via callbacks.
 *
 * @param {Object} props
 * @param {Object|null} props.nextQuizEvent - Normalized pending event (or null)
 * @param {(eventPreset: Object) => void} props.onArmEvent
 * @param {() => void} props.onClearEvent
 */
export default function EventBooster({ nextQuizEvent, onArmEvent, onClearEvent }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">이벤트 부스터</p>
          <Badge variant={nextQuizEvent ? 'primary' : 'neutral'}>
            {nextQuizEvent ? '예약됨' : '없음'}
          </Badge>
        </div>
        <p className="text-slate-900 text-sm font-medium">다음 퀴즈에 즉시 적용</p>
        <p className="text-slate-400 text-xs leading-relaxed">
          강의 중 깜짝 보너스 라운드를 열어 참여를 끌어올릴 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {QUIZ_EVENT_PRESETS.map((eventPreset) => {
          const isSelected = nextQuizEvent?.id === eventPreset.id;
          return (
            <button
              key={eventPreset.id}
              onClick={() => onArmEvent(eventPreset)}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                isSelected ? EVENT_ACCENT.selected : EVENT_ACCENT.idle
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{eventPreset.label}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{eventPreset.description}</p>
            </button>
          );
        })}
      </div>

      {nextQuizEvent && <QuizEventBanner event={nextQuizEvent} state="pending" compact />}

      <Button
        onClick={onClearEvent}
        variant="secondary"
        size="sm"
        className="w-full"
        disabled={!nextQuizEvent}
      >
        이벤트 해제
      </Button>
    </div>
  );
}
