import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function DeleteSessionModal({ open, onClose, session, onConfirm }) {
  const [deleting, setDeleting] = useState(false);

  if (!session) return null;

  const label = session.courseName
    ? `${session.courseName} ${session.roundNumber ? `${session.roundNumber}차` : ''}`
    : `세션`;

  async function handleDelete() {
    setDeleting(true);
    try {
      const ok = await onConfirm(session.id);
      if (ok) onClose();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Modal open={open} onClose={deleting ? undefined : onClose} ariaLabel="세션 삭제 확인">
      <div className="flex flex-col items-center text-center gap-4">
        <AlertTriangle size={24} className="text-red-500" />
        <div>
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
            세션을 삭제하시겠습니까?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{label}</span>
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            참여자, 투표 결과, 채팅 등 모든 데이터가 영구 삭제됩니다.
            <br />이 작업은 되돌릴 수 없습니다.
          </p>
        </div>
        <div className="flex gap-3 w-full mt-2">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose} disabled={deleting}>
            취소
          </Button>
          <Button variant="danger" size="md" className="flex-1" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 size={16} className="animate-spin" /> : null}
            {deleting ? '삭제 중...' : '삭제'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
