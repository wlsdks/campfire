# Pick PRD (Product Requirements Document)

> 실시간 강의 참여 플랫폼. 강사와 학생의 상호작용이 핵심.
> 이 문서는 매 개선 사이클마다 업데이트됨. (2026-03-21 기준 최신 업데이트)

---

## 1. 제품 개요

### 1.1 핵심 가치
- **실시간 강의 참여**: 강사가 질문을 출제하고, 학생이 모바일/노트북으로 즉시 참여
- **다양한 질문 유형**: 객관식, 퀴즈, O/X, 워드클라우드, Q&A, 감정 온도계, 찬반 토론, 순위 맞추기, 빈칸 채우기 (9종)
- **게이미피케이션**: 퀴즈 점수, 리더보드, 업적, 팀 대항전, 스피드 퀴즈로 학습 동기 부여
- **수업 관리**: 세션 생성/복제/삭제, 질문 보관함, 강의 템플릿, CSV 내보내기, 수업 기록 통계

### 1.2 기술 스택
- **프론트엔드**: React 19 + Vite 7 + Tailwind CSS v4 + Framer Motion
- **백엔드**: Firebase Realtime Database (서버리스)
- **아이콘**: lucide-react
- **폰트**: Pretendard (한국어) + Inter (영문/숫자)
- **드래그**: @dnd-kit (순위 맞추기 드래그&드롭)
- **QR**: qrcode.react

---

## 2. 사용자 유형

| 유형 | 접속 방식 | 주요 행동 |
|------|-----------|-----------|
| 강사 (Admin) | 로그인 (ID/PW) | 세션 생성, 질문 진행, 결과 확인, 수업 관리 |
| 학생 (Student) | QR/링크 (게스트) | 닉네임 입력 후 참여, 투표, 질문, 채팅 |
| 마스터 관리자 | 로그인 | 강사 계정 승인/관리 |

---

## 3. 기능 목록

### 3.1 인증 & 계정

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 강사 로그인 | 강사 | 완료 | ID/PW 로그인 (SHA-256 해시) |
| 강사 회원가입 | 강사 | 완료 | 마스터 승인 필요 |
| 데모 로그인 | 강사 | 완료 | 체험용 임시 접속 |
| 학생 게스트 접속 | 학생 | 완료 | QR/링크로 닉네임 입력만으로 참여 |
| 마스터 승인 | 마스터 | 완료 | 신규 강사 계정 승인/거절 |

### 3.2 클래스 & 세션 관리

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 클래스(강의) 그룹 | 강사 | 완료 | courseName으로 세션 그룹화 |
| 세션 생성 | 강사 | 완료 | 클래스 내 차수별 세션 생성 |
| 세션 복제 | 강사 | 완료 | 세션 목록에서 원클릭 복제(Copy 아이콘) + 생성 모달 내 이전 차수 복제. 질문 전체 복사(투표/런타임 데이터 제거), 같은 강의 다음 차수 자동 배정, 즉시 세션 입장 |
| 세션 삭제 | 강사 | 완료 | 진행 중 세션 삭제 불가. 확인 모달 후 Firebase 전체 삭제 + 즉시 UI 반영 |
| 세션 검색/필터 | 강사 | 완료 | 강의명 검색 + 상태 필터(전체/진행 중/질문 받기/완료/세팅중). 3개 이상 세션일 때 표시 |
| 세션 상태 흐름 | 강사 | 완료 | 세팅중(setting) → 진행중(active) → 질문 받기(reviewing) → 완료(ended) |
| 세션 종료 2단계 | 양쪽 | 완료 | active→reviewing(14일 자동 종료)→ended. 강사: "질문 받기 중" 배지+남은 일수. 학생: 하단 바 활성 유지 |
| 세션 목록 대시보드 | 강사 | 완료 | 클래스별 그룹, 참여율 통계, 상태 배지 |
| 수업 기록 탭 | 강사 | 완료 | 통계 개요(총 클래스/참여자/평균 참여율), 강의별 참여율 추이(트렌드 화살표+미니 SVG 차트), 어려웠던 질문(정답률 하위 5개), 최근 질문 목록 |
| 완료된 세션 열람 | 강사 | 완료 | 읽기전용 결과 확인 |

### 3.3 질문 유형 (9종)

| 유형 | 코드명 | 아이콘 | 설명 |
|------|--------|--------|------|
| 객관식 | choice | BarChart3 | 2~5개 선택지, 정답 설정 가능 |
| 퀴즈 | quiz | Trophy | 객관식 + 점수 시스템 + 속도 보너스 |
| O/X | ox | Circle | 참/거짓 이진 선택, 정답 설정 |
| 워드클라우드 | wordcloud | Cloud | 자유 텍스트 입력 → 빈도 기반 시각화 |
| Q&A | qna | MessageSquare | 자유 텍스트 답변 → 카드 그리드 |
| 감정 온도계 | scale | Thermometer | 0~100 슬라이더 → 평균/히스토그램 통계 |
| 찬반 토론 | debate | Swords | 찬성/반대 선택 + 한 줄 의견(50자) → 비율 바+의견 스트림 |
| 순위 맞추기 | ranking | ArrowUpDown | 3~6개 항목 드래그&드롭 정렬 → 위치별 정답률 |
| 빈칸 채우기 | fillinblank | TextCursorInput | 문장 내 ___빈칸 → 텍스트 입력 → 정답 판정(대소문자 무관) |

### 3.4 질문 관리

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 질문 추가/편집 | 강사 | 완료 | 9종 유형 모두 지원. 중앙 패널에서 폼 열기 |
| 질문 활성화/중지 | 강사 | 완료 | 빠른 진행 카드로 원클릭 |
| 질문 복제/삭제 | 강사 | 완료 | 기존 질문 관리 |
| 질문 순서 변경 | 강사 | 완료 | 위/아래 화살표, 강의 템플릿 편집에서도 동일 |
| 정답 설정 | 강사 | 완료 | 객관식/퀴즈/OX 모두 정답 필수 |
| 정답 표시 | 강사 | 완료 | 완료 세션 자동 공개, 진행 중은 수동 |
| 질문 보관함 | 강사 | 완료 | 자주 쓰는 질문 저장/재사용. 대시보드 "질문 보관함" 탭. 검색, 유형별 필터 |
| 질문 템플릿 팩 | 강사 | 완료 | 사전 제작 5종(아이스브레이킹/수업 평가/팀빌딩/CS 기초 퀴즈/비판적 사고). 원클릭 보관함 추가 |
| CSV 내보내기 | 강사 | 완료 | 질문 요약(응답률/정답률/분포) + 참여자별 응답(답변/점수/티켓). BOM 포함 Excel 호환 |

### 3.5 투표 & 학생 참여

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 실시간 투표 | 학생 | 완료 | 활성화된 질문에 즉시 참여 |
| 투표 확인 애니메이션 | 학생 | 완료 | 체크 SVG 애니메이션 + 선택한 답변 표시 |
| 학생 실시간 결과 | 학생 | 완료 | 투표 후 객관식/OX 실시간 분포 미니 차트 (퀴즈 제외) |
| 질문 진행 표시 | 학생 | 완료 | "질문 1/3" 텍스트 + 진행 바 |
| 포인트 베팅 | 양쪽 | 완료 | 퀴즈에 1x(안전)/2x(자신,-30점)/3x(올인,-60점) 베팅. 총점 최소 0 |

### 3.6 시각화 & 결과

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 바 차트 | 강사 | 완료 | 인디고 그라데이션, 정답 하이라이트, max-w-xl |
| O/X 배틀 | 강사 | 완료 | 분할 비율 표시, 정답 체크 |
| 워드클라우드 시각화 | 강사 | 완료 | 크기 분포, 페이드인 |
| Q&A 카드 | 강사 | 완료 | 카드 그리드, 스크롤 |
| 감정 온도계 차트 | 강사 | 완료 | 평균 히어로 숫자 + 위치 바 + 10구간 히스토그램 + 통계 |
| 찬반 토론 차트 | 강사 | 완료 | 퍼센트 VS 히어로 + 비율 바 + 의견 스트림(필터) |
| 순위 맞추기 차트 | 강사 | 완료 | 평균 정확도 % + 위치별 정답률 바 + 정답 순서 레퍼런스 |
| 빈칸 채우기 차트 | 강사 | 완료 | 정답률 % + 답변 빈도 바 차트 + 정답 하이라이트 |
| 발표 모드 | 강사 | 완료 | 전체화면, 시각화만 표시. 접이식 QR 오버레이 |

### 3.7 퀴즈 & 점수 시스템

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 퀴즈 점수 시스템 | 양쪽 | 완료 | 기본점수(50/100/200/500) + 속도 보너스(최대 50점, 30초 윈도우) |
| 정답 공개 | 강사 | 완료 | 수동 공개 + 완료 세션 자동 |
| 정답 축하 이펙트 | 학생 | 완료 | 24개 슬레이트 파티클 SVG 버스트 (원/사각/다이아몬드), 1.2초 |
| 리더보드 (강사) | 강사 | 완료 | 상위 랭킹 표시 |
| 리더보드 (학생) | 학생 | 완료 | 내 순위 히어로 카드, 연속 정답 배지, 순위 변동 화살표, 8위 밖 스티키 카드 |
| 이벤트 부스터 | 강사 | 완료 | 2배 점수 / 티켓 러시 / 잭팟 라운드 |
| 연승 시각화 | 학생 | 완료 | 3연속+ StreakBadge(Flame+텍스트), 5연속+ 다크 배지+빠른 화염 |
| 스피드 퀴즈 모드 | 양쪽 | 완료 | 퀴즈 2개+ 시 활성화. 자동 10초 타이머 → 정답 공개 → 3.5초 대기 → 다음 문제 → 리더보드. 학생: 진행 배너+콤보 카운터(3연속 1.2배, 5연속 1.5배) |
| 팀 대항전 | 양쪽 | 완료 | 2~4팀 자동 배정(최소 4명). 팀별 총점/평균 바 차트, Crown 선두 팀. 학생에 TeamBadge. 발표 모드 지원 |
| 숨겨진 업적 시스템 | 양쪽 | 완료 | 5종: 첫 정답(Sparkle), 5연속(Flame), 전문항 참여(CheckCheck), 번개 응답/3초(Zap), 만점왕(Crown). 실시간 토스트+요약 카드 표시. 강사 ClassSummary에 달성 통계 |

### 3.8 실시간 상호작용

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 실시간 채팅 | 양쪽 | 완료 | 세션 내 강사-학생 채팅 (팝업 모달). 학생 하단 바에서 접근 |
| 손들기 | 학생→강사 | 완료 | 학생이 손들면 강사 우측 패널에 표시 |
| 긴급 질문 | 학생→강사 | 완료 | 익명 긴급 질문 전송 |
| 수업 질문 보드 | 양쪽 | 완료 | 학생 실명 Q&A + 추천(upvote) + 강사 답변 완료/삭제. participantId 기반 추천 토글, 3초 쿨다운. 추천순 정렬 |
| 리액션 | 학생 | 완료 | 5종 아이콘별 고유 색상, 파티클 버스트, 3초 쿨다운 |
| 참여자 목록 | 강사 | 완료 | 접속자 + 답변 횟수(N개 참여) |

### 3.9 게임 & 이벤트

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 돌림판 (룰렛) | 강사 | 완료 | 참여자 중 무작위 선택. 컨페티+아바타 결과 발표 |
| 제비뽑기 (로터리) | 강사 | 완료 | 카드 뒤집기 당첨. 아바타+컨페티+리셋 |
| 경품 추첨 | 강사 | 완료 | N명 랜덤 추첨. 슬롯머신→당첨 발표+컨페티. 1/2-3/4+ 레이아웃 |
| 타이머 | 강사 | 완료 | 15/30/60/커스텀, 헤더 아이콘 팝업 |
| 학생 타이머 | 학생 | 완료 | 카운트다운 바 (녹→황→적), 시간 종료 시 투표 잠금 + 안내 오버레이 |

### 3.10 UI/UX

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 3패널 레이아웃 | 강사 | 완료 | 좌(질문관리)/중(시각화)/우(참여자). 접기/펼치기 애니메이션 |
| 태블릿 반응형 | 강사 | 완료 | 768~1023px 오버레이 드로어. Framer Motion slide-in |
| 아코디언 시스템 | 강사 | 완료 | 문항/모드/팀전/손들기/긴급질문/수업질문/참여자/랭킹 |
| QR코드 공유 | 강사 | 완료 | 우측 패널 + 발표 모드 접이식 오버레이 |
| 학생 대기 화면 | 학생 | 완료 | IdleMascot 애니메이션(5종 랜덤 동작), 참여자 수, 순환 팁 메시지 |
| 학생 입장 페이지 | 학생 | 완료 | 강의명 표시, 닉네임 2자+ 유효성, 글자수 카운터, 아바타 미리보기 |
| 수업 요약 카드 | 학생 | 완료 | 세션 종료 시 참여/정답률/총점/순위/연속정답/업적 요약. 성과별 동적 타이틀 |
| 키보드 단축키 | 강사 | 완료 | 좌우(질문 이동), Space(다음), R(정답공개), L(리더보드), Esc(대기) |
| 연결 상태 배너 | 학생 | 완료 | 오프라인 시 경고, 재연결 시 자동 소멸. Firebase .info/connected |
| 세션 경과 시간 | 강사 | 완료 | 헤더에 "N분 경과" 실시간 표시 |
| 학생 알림음 | 학생 | 완료 | 새 질문 시 Web Audio API 2음 차임(C5→E5). 헤더 음소거 토글 |
| 에러 바운더리 | 전체 | 완료 | 라우트+시각화+투표 레벨 세분화, 한국어 복구 UI |
| PWA 매니페스트 | 학생 | 완료 | 홈 화면 추가, 서비스워커, Apple 메타태그 |
| Admin 빈 상태 | 강사 | 완료 | 마스코트 + 단계별 안내 |
| 긴급 질문 모달 | 강사 | 완료 | 클릭→중앙 팝업→확인(삭제)/닫기(읽음). MessageCircle 아이콘 |
| 수업 질문 모달 | 강사 | 완료 | 클릭→팝업→답변완료/닫기. HelpCircle 아이콘, 좋아요 수 |
| 질문 reviewing 알림 | 학생 | 완료 | 강사가 질문 확인 중→학생 "강사가 확인하고 있어요" 배너 |
| 아코디언 흔들림 | 강사 | 완료 | 새 질문/손들기 수신 시 헤더 x축 shake 0.5s |
| 채팅 아바타 UI | 양쪽 | 완료 | KakaoTalk 스타일 아바타+이름+버블+시간 |
| 채팅 스마트 스크롤 | 양쪽 | 완료 | 하단 100px 내→자동 스크롤, 위 스크롤 시 유지 |
| 복사 세션코드 | 학생 | 완료 | 대기 화면 세션코드 터치→클립보드 복사+체크 피드백 |
| 대기 팁 아이콘 | 학생 | 완료 | 순환 팁에 contextual 아이콘 (Zap/Hand/MessageSquare 등) |
| 사자 마스코트 | 전체 | 완료 | PickMascot — 뭉글뭉글 갈기, 눈 깜빡임. xs/sm/md/lg 사이즈 |

### 3.11 다크 모드

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 라이트/다크/시스템 테마 | 양쪽 | 완료 | Tailwind CSS v4 @custom-variant dark 클래스 전략 |
| useTheme 훅 | 전체 | 완료 | localStorage 기억, prefers-color-scheme 연동, html.dark 토글 |
| 강사 테마 설정 | 강사 | 완료 | 더보기 탭 "화면 테마" 섹션(Sun/Moon/Monitor 3버튼) |
| 학생 자동 테마 | 학생 | 완료 | 시스템 설정 자동 추종 |
| 다크 팔레트 | 전체 | 완료 | bg-slate-900(배경), bg-slate-800(카드), border-slate-700(테두리), text-slate-100~400(텍스트). CTA 반전(dark:bg-slate-100) |

### 3.12 대시보드 탭

| 탭 | 설명 |
|----|------|
| 내 클래스 | 세션 목록, 클래스별 그룹, 검색/필터, 생성/복제/삭제 |
| 수업 기록 | 통계 개요, 참여율 추이, 어려웠던 질문, 최근 질문 |
| 질문 보관함 | 질문 저장/재사용, 유형 필터, 템플릿 팩 5종 |
| 더보기 | 프로필 편집, 나의 활동 통계, 키보드 단축키, 앱 정보, 테마 설정 |

### 3.13 성능 & 최적화

| 기능 | 상태 | 설명 |
|------|------|------|
| 번들 최적화 | 완료 | React.lazy 코드 스플리팅. 단일 921kB→최대 196kB(79% 감소). Vite manualChunks 5개(react/firebase/framer-motion/lucide+qrcode/dnd-kit) |
| React.memo | 완료 | 14개 컴포넌트 적용 |
| useMemo/useCallback | 완료 | hooks 파생값 메모이제이션, AdminPage 콜백 안정화 |
| 접근성 감사 | 완료 | aria-label, role, aria-expanded, aria-pressed, focus-visible, aria-hidden |
| 컴포넌트 크기 감사 | 완료 | 200줄 초과 분리: AdminPage 594→112줄, QuestionManager 541→155줄 등 12개 파일 추출 |

---

## 4. 사용자 흐름

### 4.1 강사 흐름
```
로그인 → 대시보드 (4탭: 내 클래스/수업 기록/질문 보관함/더보기)
  → 세션 생성 (강의명+차수) → 세션 입장 (3패널: 질문/시각화/참여자)
  → 질문 추가 (9종 유형) → 세션 시작 → 질문 활성화
  → 실시간 결과 확인 + 정답 공개 + 리더보드
  → 게임(룰렛/제비뽑기) + 이벤트(부스터/스피드퀴즈/팀전)
  → 종료(→reviewing, 14일) 또는 완전 종료(→ended)
  → 결과 열람 + CSV 내보내기
```

### 4.2 학생 흐름
```
QR/링크 → 입장 (강의명 표시, 닉네임 입력, 아바타 미리보기)
  → 대기 화면 (IdleMascot, 참여자 수, 팁 메시지)
  → 질문 활성화 → 투표 (유형별 UI)
    - 퀴즈: 베팅 선택 → 답변 → 타이머 종료 → 정답 공개 → 업적 토스트
  → 투표 확인 → 실시간 결과 미니 차트
  → 리더보드 (내 순위, 연승 배지)
  → 세션 종료 → 수업 요약 카드 (참여/정답률/순위/업적)
  → 하단 바: 손들기 / 긴급 질문 / 수업 질문 / 채팅
```

### 4.3 학생 하단 바 구성 (4열)
| 버튼 | 아이콘 | 기능 |
|------|--------|------|
| 손들기 | Hand | 강사에게 손들기 신호 (토글) |
| 긴급 | MessageCircle | 익명 긴급 질문 전송 |
| 질문 | HelpCircle | 수업 질문 보드 (실명 Q&A + 추천) |
| 채팅 | MessageSquare | 실시간 채팅 |

---

## 5. 데이터 구조 (Firebase Realtime DB)

```
sessions/
  {sessionId}/
    status: "setting" | "active" | "reviewing" | "ended"
    courseName, roundNumber, createdAt, startedAt, reviewingUntil
    currentQuestion, currentMode
    adminUid

    questions/
      {questionId}/
        type: "choice" | "ox" | "quiz" | "wordcloud" | "qna" | "scale" | "debate" | "ranking" | "fillinblank"
        title, order, options[], correctAnswer
        points, betting, event, activatedAt, revealedAt, awardedAt
        participationTickets, correctBonusTickets, maxSpeedBonus, speedWindowMs
        votes/
          {participantId}/
            value     — 선택값(객관식: "A", OX: "O"/"X", 온도계: "72", 토론: "for:의견" | "against:의견", 순위: "2,0,3,1", 빈칸: 텍스트)
            nickname
            timestamp
            bet       — 베팅 배수 (1/2/3, 베팅 활성화 시)

    participants/
      {participantId}/
        nickname, joinedAt, online

    scores/
      {participantId}/
        nickname, total, tickets, streak, maxStreak

    chat/
      {messageId}/
        text, sender, senderType ("student" | "instructor"), timestamp

    reactions/
      {reactionId}/
        type, timestamp

    urgentQuestions/
      {questionId}/
        text, timestamp, read

    classQuestions/
      {questionId}/
        text, nickname, participantId, timestamp, answered
        upvotes/
          {participantId}: true

    handRaises/
      {participantId}/
        raised, nickname, timestamp

    timer/
      endTime, duration, running, startedAt

    speedQuiz/                    // transient — 종료 시 삭제
      active, startedAt, totalQuestions

    teamBattle/                   // transient — 종료 시 삭제
      active, teamCount, startedAt
      teams/
        team0: { name, members/{pid: true} }
        team1: { name, members/{pid: true} }
        ...

questionLibrary/
  {adminUid}/
    {qId}/
      type, title, options[], correctAnswer, points, savedAt, updatedAt

courseTemplates/
  {courseId}/
    name, createdAt
    questions/
      {qId}/
        type, title, options[], correctAnswer, ...

admins/
  {uid}/
    username, passwordHash, displayName, role ("admin" | "master"), approved, createdAt
```

---

## 6. 데모 데이터

`node scripts/seed-demo.mjs`로 6개 클래스, 14개 세션 생성.

| 데이터 유형 | 적용 세션 | 설명 |
|-------------|-----------|------|
| 질문 & 투표 | 모든 세션 | 9종 유형, 가중치 기반 투표 |
| 채팅 | active 세션 3개 | 학생-강사 혼합 메시지 (6~10개) |
| 손들기 | active 세션 3개 | 2~4명 학생 |
| 긴급 질문 | active 세션 3개 | 2~4개 익명 질문, 읽음/안읽음 |
| 수업 질문 | active + reviewing 세션 | 실명 질문 + 추천(upvote) |
| 퀴즈 점수 | quiz 있는 세션 | 정답 기반 점수 + 속도 보너스 + 티켓 |
| 팀 대항전 | active 세션 | 3팀 배정 데모 |

---

## 7. 파일 구조

```
src/
  app/routes/
    admin/                   — 강사 화면 (27개 컴포넌트)
      AdminPage.jsx          — 메인 진입점 (112줄)
      AdminLogin.jsx         — 로그인 분기
      LoginView.jsx          — 로그인 폼
      RegisterView.jsx       — 회원가입 폼
      AdminSessionHeader.jsx — 세션 헤더 (타이머/배지/액션)
      SessionDashboard.jsx   — 대시보드 (4탭)
      SessionList.jsx        — 세션 목록
      SessionSearchFilter.jsx — 검색/필터 UI
      DeleteSessionModal.jsx — 삭제 확인 모달
      CreateSessionModal.jsx — 세션 생성 모달
      QuestionManager.jsx    — 질문 관리 패널 (155줄)
      QuestionForm.jsx       — 질문 추가/편집 폼 (131줄)
      QuestionFormSections.jsx — 폼 섹션 분리
      QuestionList.jsx       — 질문 목록 + 빠른 진행 카드
      QuickProgressCard.jsx  — 빠른 진행 카드 추출
      CenterContent.jsx      — 중앙 패널 콘텐츠
      RightSidebar.jsx       — 우측 사이드바
      TabletDrawers.jsx      — 태블릿 오버레이 드로어
      ModeSwitcher.jsx       — 모드 전환 아코디언
      PresentationView.jsx   — 발표 모드
      ClassSummary.jsx       — 완료 세션 인사이트
      CourseEditor.jsx       — 강의 템플릿 편집
      EventBooster.jsx       — 이벤트 부스터
      ExportMenu.jsx         — CSV 내보내기 메뉴
      ImportFromLibraryModal.jsx — 보관함에서 가져오기
      StatsView.jsx          — 수업 기록 탭
      StatsInsights.jsx      — 트렌드/난이도 분석
      QuestionLibraryView.jsx — 질문 보관함 탭
      TemplatePacks.jsx      — 템플릿 팩 5종
      MoreView.jsx           — 더보기 탭
      ProfileSection.jsx     — 프로필 편집
    student/                 — 학생 화면 (9개 컴포넌트)
      VotePage.jsx           — 투표 메인
      WaitingPage.jsx        — 대기 화면
      JoinPage.jsx           — 입장/닉네임
      StudentHeader.jsx      — 학생 헤더
      StudentBottomBar.jsx   — 하단 바 (4열)
      LeaderboardPage.jsx    — 리더보드
      SessionEndedPage.jsx   — 세션 종료 요약
      IdleMascot.jsx         — 마스코트 idle 애니메이션
      VoteHelpers.jsx        — 투표 유틸 컴포넌트

  components/ui/             — 공유 UI 프리미티브 (16개)
    Avatar, Badge, Button, Card, ConnectionBanner, ConnectionDot,
    EmptyState, ErrorBoundary, IconButton, InstallPrompt, Modal,
    PickMascot, QRCode, QuizEventBanner, Skeleton, Toast

  features/                  — 비즈니스 기능 (12개 도메인)
    chat/                    — ChatPanel, useChat
    class-questions/         — ClassQAPanel, ClassQuestionList, useClassQuestions
    games/                   — Roulette, Lottery, PrizeDraw
    hand-raise/              — HandRaiseList, useHandRaises
    participants/            — ParticipantList, JoinToast, useParticipants
    questions/               — UrgentQuestionList, useUrgentQuestions
    quiz/                    — QuizResult, Leaderboard, AchievementToast, SpeedQuizBanner,
                               SpeedQuizCombo, StreakBadge, TeamBadge, BetSelector,
                               useScores, useAchievements, useSpeedQuiz, useSpeedQuizStudent
    reactions/               — ReactionBar, ReactionOverlay, useReactions, reactionConfig
    session/                 — SessionStatus, useSession, useSessionList
    teams/                   — TeamBattleControl, TeamScoreboard, useTeamBattle, useTeamScores
    timer/                   — TimerCountdown, TimerPopup, useTimer
    visualization/           — BarChart, OXBattle, WordCloud, QACards, ScaleChart,
                               DebateChart, RankingChart, FillBlankChart, VizRenderer,
                               BetDistribution, AnswerDistribution
    voting/                  — ChoiceVoter, OXVoter, QuizVoter, TextInput, ScaleVoter,
                               DebateVoter, RankingVoter, FillBlankVoter, VoteConfirm

  hooks/                     — 공유 훅 (10개)
    useAdminKeyboardShortcuts, useAdminSession, useConnectionStatus,
    useMediaQuery, useQuestionActions, useQuestionChime,
    useRecentQuestions, useTheme, useToast, useVotes

  lib/                       — 유틸리티 (10개)
    auth.js, chime.js, csv.js, design-tokens.js, firebase.js,
    participant.js, question-types.js, quiz.js, template-packs.js, utils.js
```

---

## 8. 계획 중인 기능

| 기능 | 대상 | 우선순위 | 설명 |
|------|------|----------|------|
| 학생별 참여도 분석 | 강사 | 중간 | 개별 학생의 세션별 참여율, 정답률, 성장 추이 |
| 세션 복제 (전체) | 강사 | 완료 | 원클릭 복제: 세션 목록 Copy 아이콘 + 생성 모달 내 복제. 질문 전체 복사 |
| 랜덤 보상 | 양쪽 | 낮음 | 참여만 해도 확률적 보너스 포인트 |
| 마스코트 다양한 포즈 | 학생 | 낮음 | 상태별(생각/축하/혼란) 마스코트 변형 |
