const sizes = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-20 h-20 text-3xl',
  '2xl': 'w-32 h-32 text-4xl',
};

export default function Avatar({ name = '', size = 'md', className = '' }) {
  // 작은 size(xs/sm)는 한 글자, md 이상은 두 글자 — 다른 학생과 구분 명확.
  // 한국어 2글자도 md 이상에서는 가독성 충분.
  const isSmall = size === 'xs' || size === 'sm';
  // 코드포인트 단위로 잘라 이모지·서로게이트쌍 닉네임이 깨진 글자(□)로 표시되지 않게.
  const chars = Array.from(name);
  const initials = isSmall
    ? ((chars[0] || '').toUpperCase() || '?')
    : (chars.slice(0, 2).join('').toUpperCase() || '?');

  return (
    <div className={`rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 flex items-center justify-center font-semibold ${sizes[size]} ${className}`}>
      {initials}
    </div>
  );
}
