import { useSearchParams } from 'react-router-dom';
import SubmissionPage from '@/features/assignments/components/SubmissionPage';

export default function SubmitPage() {
  const [params] = useSearchParams();
  const assignmentId = params.get('a');

  if (!assignmentId) {
    return (
      <div className="min-h-dvh bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">잘못된 링크입니다</h2>
          <p className="text-slate-400 text-[15px]">과제 링크를 다시 확인해주세요</p>
        </div>
      </div>
    );
  }

  return <SubmissionPage assignmentId={assignmentId} />;
}
