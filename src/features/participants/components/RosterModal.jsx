import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Loader2, Users, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { parseRosterText, selectRosterRows, ROSTER_NAME_MAX, ROSTER_EMPLOYEE_ID_MAX, ROSTER_MAX_ROWS } from '@/lib/roster';
import { useRosterActions } from '../api/useRoster';

/** 번호 / 이름 / 사번 / 삭제 — 헤더와 행이 같은 grid를 쓰서 열이 정확히 맞는다. */
const GRID = 'grid grid-cols-[1.5rem_1fr_1fr_1.75rem] items-center gap-2';
const CELL = 'w-full bg-transparent rounded-md px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:bg-white dark:focus:bg-slate-900';

let rowSeq = 0;
const emptyRow = () => ({ key: `r${rowSeq++}`, id: null, name: '', employeeId: '' });

/** 한 사람 = 이름 칸 + 사번 칸. 칸 테두리 대신 행 구분선으로 나눠 표처럼 읽히게 한다. */
function RosterRow({ row, index, autoFocus, onChange, onRemove, onPaste, onEnter }) {
  return (
    <div className={`${GRID} group px-3 py-1 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors duration-150`}>
      <span className="text-xs text-slate-300 dark:text-slate-600 tabular-nums text-right">{index + 1}</span>
      <input
        value={row.name}
        onChange={(e) => onChange(index, 'name', e.target.value)}
        onPaste={(e) => onPaste(e, index)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) onEnter(index); }}
        maxLength={ROSTER_NAME_MAX}
        placeholder="이름"
        aria-label={`${index + 1}번 이름`}
        autoFocus={autoFocus}
        className={CELL}
      />
      <input
        value={row.employeeId}
        onChange={(e) => onChange(index, 'employeeId', e.target.value)}
        onPaste={(e) => onPaste(e, index)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) onEnter(index); }}
        maxLength={ROSTER_EMPLOYEE_ID_MAX}
        placeholder="사번"
        aria-label={`${index + 1}번 사번`}
        className={`${CELL} tabular-nums`}
      />
      <button
        onClick={() => onRemove(index)}
        aria-label={`${index + 1}번 삭제`}
        className="w-7 h-7 rounded-md flex items-center justify-center text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/**
 * 추첨 명단 관리 팝업 — 추첨 전용 세션에서 강사가 직접 명단을 넣고 고친다.
 *
 * 입력은 두 갈래를 모두 받는다: 칸에 직접 타이핑, 그리고 엑셀에서 긁은 텍스트 붙여넣기.
 * 붙여넣기는 어느 칸에서든 감지해서 여러 행으로 펼친다(parseRosterText).
 */
export default function RosterModal({ open, onClose, sessionId, participants }) {
  const existingRows = useMemo(() => selectRosterRows(participants), [participants]);
  const { saveRoster } = useRosterActions(sessionId);

  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [focusKey, setFocusKey] = useState(null);
  // 열려 있는 동안의 편집 내용을 Firebase 갱신이 덮어쓰지 않도록 열 때 한 번만 채운다.
  const seededRef = useRef(false);

  useEffect(() => {
    if (!open) { seededRef.current = false; return; }
    if (seededRef.current) return;
    seededRef.current = true;
    const seeded = existingRows.map((row) => ({ ...row, key: `r${rowSeq++}` }));
    setRows(seeded.length > 0 ? seeded : [emptyRow()]);
    setNotice('');
  }, [open, existingRows]);

  function handleChange(index, field, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function handleRemove(index) {
    setRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((_, i) => i !== index)));
  }

  function handleAdd(afterIndex = rows.length - 1) {
    const row = emptyRow();
    setRows((prev) => [...prev.slice(0, afterIndex + 1), row, ...prev.slice(afterIndex + 1)]);
    setFocusKey(row.key);
  }

  /** 엑셀/메모장에서 긁은 여러 줄을 붙여넣으면 행으로 펼친다. 한 칸짜리 붙여넣기는 기본 동작 유지. */
  function handlePaste(e, index) {
    const text = e.clipboardData?.getData('text') || '';
    if (!/[\n\t,;]/.test(text)) return;
    const parsed = parseRosterText(text);
    if (parsed.length === 0) return;
    e.preventDefault();
    setRows((prev) => {
      const inserted = parsed.map((row) => ({ ...row, key: `r${rowSeq++}`, id: null }));
      // 붙여넣은 칸이 비어 있으면 그 행을 대체하고, 내용이 있으면 아래에 이어 붙인다.
      const target = prev[index];
      const replace = target && !target.name && !target.employeeId;
      const next = replace
        ? [...prev.slice(0, index), ...inserted, ...prev.slice(index + 1)]
        : [...prev.slice(0, index + 1), ...inserted, ...prev.slice(index + 1)];
      return next.slice(0, ROSTER_MAX_ROWS);
    });
    setNotice(`${parsed.length}명을 붙여넣었습니다. 저장하기를 눌러야 반영됩니다.`);
  }

  async function handleSave() {
    try {
      setSaving(true);
      setNotice('');
      const { count, duplicates } = await saveRoster(rows, existingRows);
      if (duplicates.length > 0) {
        setNotice(`중복 사번 ${duplicates.length}건(${duplicates.slice(0, 3).join(', ')})은 하나만 남겼습니다. ${count}명 저장 완료.`);
        return; // 무엇이 걸러졌는지 확인할 수 있게 닫지 않는다
      }
      onClose();
    } catch {
      setNotice('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  const filled = rows.filter((row) => row.name.trim() || row.employeeId.trim()).length;

  return (
    <Modal open={open} onClose={onClose} ariaLabel="추첨 명단 관리" className="sm:max-w-lg">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">명단 관리</h2>
          <p className="text-slate-400 text-sm mt-1">
            추첨 대상을 직접 입력합니다. 엑셀에서 긁은 명단을 칸에 그대로 붙여넣어도 됩니다.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className={`${GRID} px-3 py-2 bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700`}>
            <span />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">이름</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 px-2">사번</span>
            <span />
          </div>

          <div className="max-h-[42vh] overflow-y-auto scrollbar-hide divide-y divide-slate-100 dark:divide-slate-700/50">
            {rows.map((row, index) => (
              <RosterRow
                key={row.key}
                row={row}
                index={index}
                autoFocus={row.key === focusKey}
                onChange={handleChange}
                onRemove={handleRemove}
                onPaste={handlePaste}
                onEnter={handleAdd}
              />
            ))}
          </div>

          {/* 리스트의 마지막 줄처럼 붙여, 표 밖에 떠 있는 버튼이 되지 않게 한다. */}
          <button
            onClick={() => handleAdd()}
            disabled={rows.length >= ROSTER_MAX_ROWS}
            className="w-full flex items-center gap-2 px-5 py-2.5 border-t border-slate-100 dark:border-slate-700/50 text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/40 disabled:opacity-40 disabled:pointer-events-none transition-colors duration-150"
          >
            <Plus size={14} />
            행 추가
          </button>
        </div>

        {notice && (
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
            <AlertCircle size={12} className="text-amber-500 shrink-0 mt-0.5" />
            {notice}
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mr-auto">
            <Users size={14} className="text-slate-400" />
            <span className="tabular-nums font-medium">{filled}</span>명
          </span>
          <Button onClick={onClose} variant="secondary" size="sm">취소</Button>
          <Button onClick={handleSave} variant="primary" size="sm" disabled={saving}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {saving ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
