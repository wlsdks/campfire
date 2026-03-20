# Pinggo PRD (Product Requirements Document)

> 실시간 강의 참여 플랫폼. 강사와 학생의 상호작용이 핵심.
> 이 문서는 매 개선 사이클마다 업데이트됨.

---

## 1. 사용자 유형

| 유형 | 접속 방식 | 주요 행동 |
|------|-----------|-----------|
| 강사 (Admin) | 로그인 (ID/PW) | 세션 생성, 질문 진행, 결과 확인 |
| 학생 (Student) | QR/링크 (게스트) | 닉네임 입력 후 참여, 투표, 질문 |
| 마스터 관리자 | 로그인 | 강사 계정 승인/관리 |

---

## 2. 기능 목록

### 2.1 인증 & 계정

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 강사 로그인 | 강사 | ✅ 완료 | ID/PW 로그인 (SHA-256 해시) |
| 강사 회원가입 | 강사 | ✅ 완료 | 마스터 승인 필요 |
| 데모 로그인 | 강사 | ✅ 완료 | 체험용 임시 접속 |
| 학생 게스트 접속 | 학생 | ✅ 완료 | QR/링크 → 닉네임 입력만으로 참여 |
| 마스터 승인 | 마스터 | ✅ 완료 | 신규 강사 계정 승인/거절 |

### 2.2 클래스 & 세션 관리

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 클래스(강의) 그룹 | 강사 | ✅ 완료 | courseName으로 세션 그룹화 |
| 세션 생성 | 강사 | ✅ 완료 | 클래스 내 차수별 세션 생성 |
| 세션 복제 | 강사 | ✅ 완료 | 이전 차수 질문 복사해서 새 세션 |
| 세션 상태 흐름 | 강사 | ✅ 완료 | 세팅중 → 진행중 → 질문 받기(reviewing) → 완료. 2단계 종료: "종료" 클릭 시 reviewing 상태(14일 후 자동 종료)로 전환, "완전 종료" 클릭 시 ended로 전환 |
| 세션 종료 2단계 | 양쪽 | ✅ 완료 | 수업 종료 시 바로 ended 대신 reviewing 상태로 전환. 강사: "질문 받기 중" 배지+남은 일수 카운트다운+결과 보기/완전 종료 버튼. 학생: 수업 요약 카드 표시 + 하단 바(손들기/긴급질문/채팅) 활성 유지로 수업 후 질문 가능. 세션 목록에 "질문 받기" 상태 표시(pulsing dot). Firebase reviewingUntil 타임스탬프 저장 |
| 세션 목록 대시보드 | 강사 | ✅ 완료 | 클래스별 그룹, 참여율 통계 |
| 수업 기록 탭 | 강사 | ✅ 완료 | 전체 통계 개요, 강의별 참여율 |
| 완료된 세션 열람 | 강사 | ✅ 완료 | 읽기전용 결과 확인 |
| 세션 삭제 | 강사 | ✅ 완료 | 불필요한 세션 삭제. 세션 행 hover 시 Trash2 아이콘 표시(진행 중 세션은 삭제 불가). 클릭 시 DeleteSessionModal(강의명+차수 표시, 경고 텍스트, 취소/삭제 버튼). 확인 시 Firebase sessions/{id} 전체 삭제(participants/votes/chat/scores 포함). 즉시 UI 반영(optimistic update). 모바일에서 삭제 버튼 항상 표시(max-sm:opacity-60). 3뷰포트(1280/768/390) 확인, 콘솔 에러 0 |
| 세션 검색/필터 | 강사 | ✅ 완료 | 대시보드 "내 클래스" 탭에서 세션 검색 및 상태 필터링. 검색: 강의명(courseName) 기반 실시간 검색, X 버튼으로 검색어 클리어. 상태 필터: 전체/진행 중/질문 받기/완료/세팅중 5종 칩. 검색+필터 조합 가능. 결과 카운트("N개 세션") + "초기화" 버튼. 결과 없을 때 EmptyState(검색어 포함 안내 텍스트). 세션 3개 이상일 때만 검색 UI 표시(소수 세션에서 불필요한 UI 방지). 모바일: 세션 행 축약(접속/참여/질문 통계 → "N명"으로 간소화), 탭 whitespace-nowrap. 다크 모드 지원. SessionSearchFilter.jsx 신규. 3뷰포트(1280/768/390) 확인, 콘솔 에러 0 |

### 2.3 질문 & 투표

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 객관식 질문 | 양쪽 | ✅ 완료 | 2~5개 선택지, 정답 설정 |
| O/X 질문 | 양쪽 | ✅ 완료 | 참/거짓, 정답 설정 |
| 퀴즈 질문 | 양쪽 | ✅ 완료 | 객관식 + 점수 + 속도 보너스 |
| 워드클라우드 | 양쪽 | ✅ 완료 | 자유 텍스트 입력 → 시각화 |
| Q&A | 양쪽 | ✅ 완료 | 자유 질문/답변 카드 |
| 감정 온도계 (Scale) | 양쪽 | ✅ 완료 | 0~100 슬라이더로 의견 강도 표현. 학생: 모바일 슬라이더+프리셋 버튼(0/25/50/75/100)+제출 확인. 강사: 평균 히어로 숫자+위치 바+10구간 히스토그램+중앙값/최솟값/최댓값 통계. Firebase votes에 숫자를 문자열로 저장. 질문 보관함/CSV 내보내기/강의 템플릿 모두 지원. Thermometer 아이콘 |
| 찬반 토론 (Debate) | 양쪽 | ✅ 완료 | 주제에 대해 찬성/반대 선택 + 한 줄 의견(50자, 선택). 학생: 찬성/반대 2버튼 선택 → 의견 입력 → 제출 → 실시간 비율 바(내 선택 표시). 강사: 퍼센트 VS 히어로 표시 + 비율 바 + 의견 스트림(전체/찬성/반대 필터). Firebase votes에 "for:의견" 또는 "against:의견" 형식으로 저장. Swords 아이콘. 질문 보관함/CSV 내보내기/강의 템플릿 모두 지원 |
| 순위 맞추기 (Ranking) | 양쪽 | ✅ 완료 | 3~6개 항목을 올바른 순서로 배열하는 문제. 강사: QuestionForm에서 항목 입력 + 화살표로 정답 순서 조정(최소 3개, 최대 6개). QuestionList에 ArrowUpDown 아이콘 표시. RankingChart(평균 정확도 히어로 %, 위치별 정답률 바, 전부 정답 인원, 정답 순서 레퍼런스). 학생: RankingVoter — dnd-kit 기반 드래그&드롭 정렬, 결정적 셔플(questionId+participantId 시드), 위치 번호+GripVertical 핸들, "이 순서로 제출" 버튼, VoteConfirm에 순서 표시. Firebase votes에 쉼표 구분 인덱스("2,0,3,1") 저장. correctAnswer도 인덱스 형식("0,1,2,3"). database.rules.json, CSV, seed-demo, 강의 템플릿 모두 지원 |
| 빈칸 채우기 (FillInBlank) | 양쪽 | ✅ 완료 | 문장에 빈칸(___) → 학생이 답 입력. 강사: QuestionForm에서 문장 입력 시 ___ 로 빈칸 표시 + 정답 입력, 실시간 미리보기. QuestionList에 TextCursorInput 아이콘 표시. FillBlankChart(문장+빈칸 표시, 정답률 히어로 %, 답변 빈도 바 차트, 정답 공개 시 정답 하이라이트+오답 X 표시, 대소문자 무관 정답 판정). 학생: FillBlankVoter — 문장 속 빈칸을 실시간 미리보기(입력 중 ??? → 답변으로 치환), 30자 제한 입력+제출, VoteConfirm에 내 답변 표시, AnswerDistribution(실시간 정답률 바+상위 5개 답변 순위). Firebase votes에 텍스트 문자열 저장. database.rules.json, CSV, seed-demo, 강의 템플릿 모두 지원 |
| 정답 표시 | 강사 | ✅ 완료 | 완료 세션 자동 공개, 진행중은 수동 |
| 정답 설정 (모든 유형) | 강사 | ✅ 완료 | 객관식/퀴즈/OX 모두 정답 필수 |
| 질문 활성화/중지 | 강사 | ✅ 완료 | 빠른 진행 카드로 원클릭 |
| 질문 복제/삭제 | 강사 | ✅ 완료 | 기존 질문 관리 |
| 질문 순서 변경 | 강사 | ✅ 완료 | 위/아래 화살표로 질문 순서 조정, 강의 템플릿 편집에서도 동일 |
| CSV 내보내기 | 강사 | ✅ 완료 | 완료 세션의 질문 결과(응답률/정답률/분포) 및 참여자별 응답(답변/점수/티켓) CSV 다운로드. BOM 포함 Excel 호환 |
| 질문 보관함 | 강사 | ✅ 완료 | 자주 쓰는 질문을 보관함에 저장/재사용. 대시보드 "질문 보관함" 탭에서 새 질문 생성, 검색, 유형별 필터. 세션 내 질문에서 보관함으로 저장(BookmarkPlus), 보관함에서 세션으로 가져오기(ImportFromLibraryModal). Firebase path: questionLibrary/{adminUid}/{qId} |
| 질문 템플릿 팩 | 강사 | ✅ 완료 | 바로 사용할 수 있는 사전 제작 질문 모음 5종(아이스브레이킹/수업 평가/팀빌딩/CS 기초 퀴즈/비판적 사고). 질문 보관함 탭 상단에 TemplatePacks 섹션 표시. 각 팩 5개 질문(10종 유형 혼합: choice/quiz/ox/wordcloud/qna/scale/debate/ranking/fillinblank). 아코디언 펼치기로 질문 미리보기(번호+유형아이콘+질문텍스트). "보관함에 추가" 원클릭으로 전체 팩 개인 라이브러리에 저장. 추가 완료 시 Check 아이콘 상태 전환. 저장된 질문은 ImportFromLibraryModal로 세션에 즉시 가져오기 가능. src/lib/template-packs.js(데이터) + src/app/routes/admin/TemplatePacks.jsx(UI). Firebase 추가 구조 불필요(기존 questionLibrary 활용) |
| 실시간 투표 | 학생 | ✅ 완료 | 활성화된 질문에 실시간 참여 |
| 투표 확인 애니메이션 | 학생 | ✅ 완료 | 투표 후 체크 애니메이션 + 선택한 답변 표시 |
| 학생 실시간 결과 | 학생 | ✅ 완료 | 투표 후 객관식/OX 실시간 분포 미니 차트 (퀴즈 제외) |

### 2.4 시각화 & 결과

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 바 차트 | 강사 | ✅ 완료 | 득표수 기반 색상, max-w-xl 제한 |
| O/X 배틀 | 강사 | ✅ 완료 | 분할 표시, 정답 체크 표시 |
| 워드클라우드 시각화 | 강사 | ✅ 완료 | 크기 분포, 페이드인 |
| Q&A 카드 | 강사 | ✅ 완료 | 카드 그리드, 스크롤 |
| 발표 모드 | 강사 | ✅ 완료 | 전체화면, 시각화만 표시 |

### 2.5 퀴즈 & 점수

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 퀴즈 점수 시스템 | 양쪽 | ✅ 완료 | 기본점수(50/100/200/500) + 속도 보너스 |
| 정답 공개 | 강사 | ✅ 완료 | 수동 공개 + 완료 세션 자동 |
| 리더보드 | 강사 | ✅ 완료 | 상위 랭킹 표시 |
| 학생 리더보드 | 학생 | ✅ 완료 | 내 순위 히어로 카드(순위/상위 %), 연속 정답·최고 연속 배지, "나" 태그 하이라이트, 순위 변동 화살표(실시간), 8위 밖일 때 하단 스티키 카드, layoutId 기반 순서 변경 애니메이션 |
| 이벤트 부스터 | 강사 | ✅ 완료 | 2배 점수 / 티켓 러시 / 잭팟 라운드 |
| 퀴즈 결과 (학생) | 학생 | ✅ 완료 | 정답/오답 + 획득 점수 표시 |
| 정답 축하 이펙트 | 학생 | ✅ 완료 | 정답 시 Framer Motion SVG 파티클 버스트 — 24개 슬레이트 파티클(원/사각/다이아몬드), 카드 내 overflow-hidden으로 제한, 1.2초 후 자동 정리 |
| 연승 시각화 | 학생 | ✅ 완료 | 퀴즈 3연속 정답 이상 시 StreakBadge(Flame 아이콘 + "N연속!" 텍스트) 표시. 투표 화면 상단에 플로팅 pill 배지, QuizResult 카드 내에 "N연속 정답!" 배지 + "연승 행진 중!" 서브텍스트. 5연속 이상은 bg-slate-900 다크 모드 배지 + 빠른 화염 애니메이션. 기존 Firebase scores.streak 데이터 활용(추가 구조 불필요). 스피드 퀴즈 모드에서는 기존 SpeedQuizCombo가 담당하고, 일반 퀴즈에서 StreakBadge가 담당 |

### 2.6 실시간 상호작용

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 실시간 채팅 | 양쪽 | ✅ 완료 | 세션 내 강사↔학생 채팅 (팝업 모달) |
| 손들기 | 학생→강사 | ✅ 완료 | 학생이 손들면 강사 우측 패널에 표시 |
| 긴급 질문 | 학생→강사 | ✅ 완료 | 익명 긴급 질문 전송 |
| 리액션 | 학생 | ✅ 완료 | 실시간 리액션 버블 — 5종 아이콘별 고유 색상 (탭 시 피드백), 파티클 버스트, 스케일/로테이션 애니메이션, 컬러 버블 오버레이 |
| 참여자 목록 | 강사 | ✅ 완료 | 접속자 + 답변 횟수(N개 참여) |

### 2.7 게임 & 이벤트

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 돌림판 (룰렛) | 강사 | ✅ 완료 | 참여자 중 무작위 선택 |
| 제비뽑기 (로터리) | 강사 | ✅ 완료 | 카드 뒤집기 당첨 |
| 타이머 | 강사 | ✅ 완료 | 15/30/60/커스텀, 헤더 아이콘 팝업 |
| 학생 타이머 표시 | 학생 | ✅ 완료 | 카운트다운 바 (녹→황→적), 시간 종료 시 투표 잠금 + 안내 오버레이 |
| 스피드 퀴즈 모드 | 양쪽 | ✅ 완료 | 퀴즈 2개 이상일 때 활성화 가능. 강사: 빠른 진행 카드에서 "스피드 퀴즈" 원클릭 시작/중단, 헤더에 "스피드" 배지. 자동 10초 타이머 → 자동 정답 공개+점수 반영 → 3.5초 후 자동 다음 문제 → 마지막 문제 후 리더보드 자동 표시. 학생: SpeedQuizBanner(문제 진행 N/M + 도트 인디케이터), SpeedQuizCombo(연속 정답 카운터, 3연속 x1.2배·5연속 x1.5배 점수 배율). Firebase path: sessions/{id}/speedQuiz(active/startedAt/totalQuestions). useSpeedQuiz(admin 자동진행 엔진), useSpeedQuizStudent(학생 읽기전용). 3뷰포트(1280/768/390) 확인, 콘솔 에러 0 |
| 팀 대항전 | 양쪽 | ✅ 완료 | 참여자를 2~4팀으로 자동 배정하여 팀별 점수 경쟁. 강사: 좌측 사이드바 TeamBattleControl 아코디언에서 팀 수(2/3/4) 선택 후 "팀 배정 시작" (최소 4명 필요). 헤더에 "팀전" 배지(bg-slate-700). ModeSwitcher에 "팀 스코어보드" 모드 추가. 중앙 TeamScoreboard: 팀별 총점/평균/인원 바 차트, Crown 아이콘 선두 팀, 점수차 안내 텍스트. 우측 패널에 팀 대항전 아코디언(기본 펼침). 발표 모드에서도 팀 스코어보드 표시. 학생: VotePage에 TeamBadge(팀 이름+인원 pill), LeaderboardPage에 팀 스코어보드+내 팀 배지. Firebase path: sessions/{id}/teamBattle(active/teamCount/teams/{teamN}/{name,members}). 개별 퀴즈 점수가 팀 총점에 실시간 합산(useTeamScores). seed-demo에 3팀 팀 배틀 데모 데이터. database.rules.json 업데이트. 3뷰포트(1280/768/390) 확인, 콘솔 에러 0 |
| 포인트 베팅 | 양쪽 | ✅ 완료 | 퀴즈 질문에 베팅 활성화 가능. 강사: QuestionForm에서 "포인트 베팅" 토글(switch UI). 활성화된 질문은 QuestionList에 "베팅" 배지 표시. 중앙 시각화에 BetDistribution(1x/2x/3x 분포 3카드). 학생: 답안 선택 전 BetSelector 단계 — 1x 안전(패널티 0), 2x 자신(정답 2배/오답 -30점), 3x 올인(정답 3배/오답 -60점). 선택 후 퀴즈 옵션 표시. VoteConfirm에 "내 답안 (Nx 라벨)" 표시. QuizResult에 베팅 배지 + 손실 시 빨간색 점수 표시. 총점 최소 0(음수 방지). Firebase votes에 bet 필드 추가. quiz.js getQuizReward에 bet 배수/패널티 로직. CSV 내보내기에 베팅 정보 포함. seed-demo에 betting 데모 데이터 추가. 3뷰포트(1280/768/390) 확인, 콘솔 에러 0 |

### 2.8 UI/UX

| 기능 | 대상 | 상태 | 설명 |
|------|------|------|------|
| 3패널 레이아웃 | 강사 | ✅ 완료 | 좌(질문)/중(시각화)/우(참여자) |
| 패널 접기/펼치기 | 강사 | ✅ 완료 | 부드러운 애니메이션 |
| 아코디언 시스템 | 강사 | ✅ 완료 | 문항/모드/손들기/긴급질문/참여자/랭킹 |
| QR코드 공유 | 강사 | ✅ 완료 | 우측 패널 + 발표 모드 |
| 스크롤바 숨김 | 강사 | ✅ 완료 | 패널 내부 스크롤만, 전체 스크롤 없음 |
| 학생 대기 화면 | 학생 | ✅ 완료 | Pinggo 마스코트 애니메이션, 참여자 수, 순환 팁 메시지 |
| Admin 빈 상태 | 강사 | ✅ 완료 | 마스코트 + 단계별 안내로 친근한 빈 화면 (질문 없음, 참여자 없음, 대시보드 등) |
| 키보드 단축키 | 강사 | ✅ 완료 | ←→ 질문 이동, Space 다음, R 정답공개, L 리더보드, Esc 대기. 힌트 배지 표시 |
| 완료 세션 인사이트 | 강사 | ✅ 완료 | 질문별 정답률, 가장 어려운 질문 하이라이트, 응답률 바, 평균 정답률 통계 |
| 헤더 질문 진행 표시 | 강사 | ✅ 완료 | 헤더에 "질문 2/5" 진행 상태 — 활성 질문 번호/전체, 비활성 시 "N개" 표시 |
| 질문 진행 표시 (학생) | 학생 | ✅ 완료 | 투표 화면에 "질문 1/3" 텍스트 + 진행 바. order 기준 정렬, 질문 전환 시 자동 업데이트. 현재 진행 상황을 학생이 한눈에 파악 |
| 연결 상태 배너 | 학생 | ✅ 완료 | 오프라인 시 "연결 끊김" 배너, 재연결 시 "다시 연결됨" 자동 소멸. Firebase .info/connected 기반 |
| 세션 경과 시간 | 강사 | ✅ 완료 | 활성 세션 헤더에 "N분 경과" 실시간 표시. startedAt 우선, createdAt 폴백. 30초 간격 업데이트, 1분 미만 숨김 |
| 마이크로 인터랙션 | 전체 | ✅ 완료 | 모든 버튼/카드에 active:scale 프레스 피드백 추가. 탭 버튼, 세션 행, 질문 액션 버튼, 아코디언 헤더, 모달 선택 버튼 등 15개 컴포넌트 일괄 적용. CSS-only로 Framer Motion 불필요한 곳은 성능 최적화 |
| 에러 바운더리 | 전체 | ✅ 완료 | React Error Boundary로 렌더 에러 시 전체 페이지 크래시 방지. 라우트 레벨(student/admin) + 시각화/투표 영역 세분화 경계. 한국어 복구 UI(다시 시도/새로고침), 에러 상세 접기 |
| 컴포넌트 크기 감사 (2차) | 전체 | ✅ 완료 | 46차 사이클 대규모 리팩토링. AdminPage 594→112줄(useAdminSession 훅+TabletDrawers+CenterContent 추출), QuestionManager 541→155줄(useQuestionActions 훅+QuickProgressCard 추출), AdminLogin 501→28줄(LoginView+RegisterView 분리), QuestionForm 500→131줄(QuestionFormSections 추출), SessionDashboard 393→138줄(SessionList 추출), StatsView 303→241줄(useRecentQuestions 훅 추출). 총 12개 파일 생성, 코드 중복 제거(question 생성 로직 통합). 빌드 성공, 3뷰포트(1280/768/390) 콘솔 에러 0 |
| 발표 모드 QR 오버레이 | 강사 | ✅ 완료 | 접이식 QR 오버레이 — 기본 축소(세션코드+참여자 수 pill), 클릭 시 확대(QR 180px+세션코드+링크복사+접속 수). Framer Motion 전환, stopPropagation으로 발표 종료 방지 |
| 디자인 토큰 감사 | 전체 | ✅ 완료 | Anti-AI 체크리스트 기반 전수 조사. design-tokens.js 레시피를 실제 컴포넌트와 동기화, Avatar/Badge/Button의 indigo→slate 교체, Lottery 레인보우→슬레이트 모노크로매틱, 세팅중 배지 amber→slate, QuizEventBanner/Roulette/Leaderboard의 장식적 색상 제거. 허용: Radio 아이콘(indigo), BarChart 브랜드 그라데이션(indigo), 타이머 기능색(amber/red), 접속 상태(emerald) |
| 성능 최적화 감사 | 전체 | ✅ 완료 | React.memo 14개 컴포넌트 적용, 훅 3개(useVotes/useParticipants/useScores) 파생값 useMemo/useCallback 메모이제이션, AdminPage 콜백 12개 useCallback 안정화, drawParticipants/studentUrl useMemo 적용 |
| 접근성 감사 | 전체 | ✅ 완료 | aria-label: 모든 아이콘 전용 버튼(채팅, 타이머, 뒤로가기 등), 모든 input/textarea에 aria-label 추가. role 속성: progressbar(참여율 바), alert(에러 메시지), status(토스트), log(참여자 알림), toolbar(학생 하단바), dialog aria-label(모달). aria-expanded: 아코디언, 타이머 팝업. aria-pressed: 손들기, 채팅 토글. focus-visible: Button/IconButton에 focus→focus-visible로 변경(키보드 전용 포커스 링). aria-hidden: 장식용 SVG 마스코트 3곳. group role: 객관식/OX 선택지 그룹 |
| 학생 입장 페이지 폴리시 | 학생 | ✅ 완료 | 390x844 모바일 최적화. 강의명 표시(Firebase에서 courseName 조회), 닉네임 2자 이상 유효성 검사 + 실시간 글자수 카운터(x/10), 에러 시 빨간 테두리 + 힌트 텍스트, 아바타 미리보기 height 애니메이션, 모바일 autoFocus 안정화(setTimeout), enterKeyHint="go", 키보드 가리지 않도록 pt-[20vh] 상단 배치, ArrowRight 아이콘으로 CTA 방향성 부여 |
| PWA 매니페스트 | 학생 | ✅ 완료 | manifest.json + 서비스워커로 "홈 화면에 추가" 지원. 아이콘 4종(192/512 일반+마스코블), Apple 메타태그(apple-touch-icon, apple-mobile-web-app-capable, status-bar-style), theme-color #0F172A, 네트워크 우선+앱 셸 캐시 전략, 학생 화면에 설치 유도 배너(Chrome beforeinstallprompt + iOS 수동 안내) |
| 태블릿 반응형 (768px) | 강사 | ✅ 완료 | 768~1023px 태블릿에서 3패널→전폭 중앙 레이아웃 전환. useMediaQuery 훅으로 실시간 감지. 좌측(질문 관리)/우측(참여자·상호작용) 사이드바가 오버레이 드로어로 변환. 헤더에 List/Users 토글 버튼 추가, 컴팩트 라벨(발표/종료), 세션 ID·경과시간 숨김. Framer Motion slide-in 애니메이션 + 백드롭. max-w-[85vw]로 모바일에서도 화면 덮지 않음. 읽기전용(완료 세션)에서도 동일 동작 |
| 수업 요약 카드 | 학생 | ✅ 완료 | 세션 종료 시 학생별 "오늘의 기록" 요약 카드 표시. 참여 문항 수(N/전체), 정답률(%), 총점, 순위(N명 중 M위), 최고 연속 정답, 전문항 참여 배지. 성과에 따른 동적 타이틀(오늘의 1등!/상위권 달성!/수고했어요! 등). CelebrationMascot(happy eyes+sparkles) SVG 애니메이션. 기존 session.questions 투표 데이터 + scores에서 실시간 계산, 별도 Firebase 구조 불필요. SessionEndedPage가 VotePage에서 session.status==='ended' 시 자동 전환 |
| 마스코트 idle 애니메이션 | 학생 | ✅ 완료 | WaitingPage 마스코트에 랜덤 idle 동작 추가. 5종 액션(눈 좌우 둘러보기, 호기심 기울기, 이중 깜빡임, 안테나 흔들기)이 3-6초 간격으로 랜덤 발동. 별도 주기적 자연 깜빡임. useAnimationControls로 명령적 시퀀싱, busyRef로 동작 충돌 방지. 기본 호흡 부유+안테나 맥동은 연속 유지. IdleMascot.jsx(198줄) 추출, WaitingPage에서 import. 3뷰포트(1280/768/390) 확인, 콘솔 에러 0 |
| 숨겨진 업적 시스템 | 양쪽 | ✅ 완료 | 학생이 세션 중 달성 조건을 충족하면 업적 배지를 획득. 5종 업적: 첫 정답(Sparkle), 5연속 정답(Flame), 전문항 참여(CheckCheck), 번개 응답/3초 이내(Zap), 만점왕/정답률 100%(Crown). 학생: VotePage에서 실시간 AchievementToast(spring 애니메이션, 3.5초 표시, 큐 기반), SessionSummaryCard에 획득 업적 리스트(아이콘+설명, stagger 애니메이션), 업적 4개 이상 시 "업적 마스터!" 타이틀. 강사: ClassSummary에 AchievementSummary(각 업적별 달성 학생 수 표시). useAchievements 훅(기존 votes/scores에서 순수 계산, Firebase 구조 추가 불필요). 3뷰포트(1280/768/390) 확인, 콘솔 에러 0 |
| 더보기 탭 | 강사 | ✅ 완료 | 대시보드 마지막 4번째 탭 구현. 4개 섹션: 프로필(아이디/표시 이름 수정/역할 표시, Firebase 실시간 저장), 나의 활동(전체·완료 클래스/누적 참여자/누적 질문 통계), 키보드 단축키 시각 가이드(질문 이동/퀴즈 진행/기타 6개 단축키, KeyBadge UI), 앱 정보(버전/플랫폼/지원 유형). MoreView(145줄)+ProfileSection(85줄) 분리. 3뷰포트(1280/768/390) 확인, 콘솔 에러 0 |
| 학생 알림음 | 학생 | ✅ 완료 | 새 질문 활성화 시 Web Audio API로 부드러운 2음 상승 차임 재생(C5→E5, 300ms, gain 0.12). useQuestionChime 훅이 currentQuestion 변경 감지. 초기 마운트 시에는 재생하지 않음(입장 시 불필요한 소리 방지). 헤더에 Volume2/VolumeOff 토글 버튼(aria-pressed, localStorage 기억). 외부 오디오 파일 불필요(순수 Web Audio API 합성). src/lib/chime.js(playChime+playTick 유틸), src/hooks/useQuestionChime.js. 3뷰포트(1280/768/390) 확인, 콘솔 에러 0 |
| 번들 최적화 | 전체 | ✅ 완료 | React.lazy + Suspense 코드 스플리팅으로 초기 로드 대폭 감소. 단일 번들 921kB → 최대 청크 196kB (79% 감소). Vite manualChunks로 벤더 라이브러리 5개 분리(react 48kB, firebase 166kB, framer-motion 134kB, lucide+qrcode 36kB, dnd-kit 44kB). 라우트 레벨 분리: AdminPage(146kB)와 VotePage(68kB) 별도 청크로 학생/강사 서로 코드 로드 안 함. 기능 레벨 지연 로드: 대시보드 탭(StatsView/QuestionLibraryView/MoreView), 게임(Roulette/Lottery), ClassSummary, LeaderboardPage, SessionEndedPage. SuspenseFallback 공통 컴포넌트. 500kB 청크 경고 0. 3뷰포트(1280/768/390) 확인, 콘솔 에러 0 |
| 다크 모드 | 양쪽 | ✅ 완료 | 라이트/다크/시스템 3종 테마 전환. Tailwind CSS v4 @custom-variant dark 기반 클래스 전략. useTheme 훅(localStorage 기억, prefers-color-scheme 연동, html.dark 클래스 토글). 강사: 더보기 탭 "화면 테마" 섹션(Sun/Moon/Monitor 아이콘 3버튼). 학생: 시스템 설정 자동 추종. 다크 팔레트: bg-slate-900(배경), bg-slate-800(카드/패널), border-slate-700(테두리), text-slate-100/200/300/400(텍스트 계층). CTA 버튼 반전(dark:bg-slate-100 dark:text-slate-900). 적용 범위: 모든 UI 프리미티브(Button/Card/Badge/Avatar/Modal/IconButton/Toast/Skeleton), 모든 레이아웃(AdminPage 3패널/SessionDashboard 대시보드/VotePage/WaitingPage/JoinPage/StudentHeader/StudentBottomBar), 드로어/채팅/에러바운더리/커넥션배너/QuestionManager/SessionList. Firebase 구조 변경 불필요. 3뷰포트(1280/768/390) 확인, 콘솔 에러 0 |

---

## 3. 계획 중인 기능

| 기능 | 대상 | 우선순위 | 설명 |
|------|------|----------|------|
| 학생 질문 탭 | 학생 | 높음 | 수업 자체에 대한 질문 (긴급질문과 별도) |
| ~~세션 종료 2단계~~ | 양쪽 | ~~높음~~ ✅ | 질문받기(reviewing, 14일) → 완전종료(ended). 강사 "질문 받기 중" 배지, 학생 하단 바 활성 유지 |
| ~~학생 채팅 접근~~ | 학생 | ~~높음~~ ✅ | 학생 하단바에서 채팅 참여 (닉네임 표시, 읽지 않은 메시지 알림) |
| 수업 결과 리포트 | 강사 | 중간 | 질문별 정답률 ✅ 완료, CSV 내보내기 ✅ 완료, 학생별 참여도 분석은 추가 개발 필요 |
| ~~질문 보관함~~ | 강사 | ~~중간~~ ✅ | 자주 쓰는 질문 저장/재사용. 대시보드 "질문 보관함" 탭에서 관리 |

---

## 4. 데이터 구조 (Firebase Realtime DB)

```
sessions/
  {sessionId}/
    status: "setting" | "active" | "reviewing" | "ended"
    courseName, roundNumber, createdAt, reviewingUntil
    currentQuestion, currentMode
    questions/
      {questionId}/
        type (choice|ox|quiz|wordcloud|qna|scale|debate|ranking|fillinblank), title, order, options[], correctAnswer
        points, event, activatedAt, revealedAt, awardedAt
        votes/{participantId}: { value, nickname, timestamp }
    participants/{participantId}: { nickname, joinedAt, online }
    scores/{participantId}: { nickname, total, tickets, streak, ... }
    chat/{messageId}: { text, sender, senderType, timestamp }
    reactions/{reactionId}: { type, timestamp }
    urgentQuestions/{questionId}: { text, timestamp, read }
    handRaises/{participantId}: { raised, nickname, timestamp }
    timer: { endTime, duration, running, startedAt }
    speedQuiz: { active, startedAt, totalQuestions }  // transient, removed when speed quiz ends
    teamBattle: { active, teamCount, startedAt, teams/{ team0: { name, members/{pid: true} }, ... } }  // transient, removed when team battle ends

questionLibrary/{adminUid}/{qId}: { type, title, options[], correctAnswer, points, savedAt, updatedAt }

admins/{uid}: { username, passwordHash, displayName, role, approved }
courseTemplates/{courseId}: { name, questions/... }
```

## 5. 데모 데이터 (seed-demo.mjs)

`node scripts/seed-demo.mjs`로 6개 클래스, 14개 세션 생성.

| 데이터 유형 | 적용 세션 | 설명 |
|-------------|-----------|------|
| 질문 & 투표 | 모든 세션 | 객관식/퀴즈/OX/워드클라우드/Q&A, 가중치 기반 투표 |
| 채팅 | active 세션 3개 | 학생↔강사 혼합 메시지 (6~10개), 시간순 |
| 손들기 | active 세션 3개 | 2~4명 학생 손 들기 상태 |
| 긴급 질문 | active 세션 3개 | 2~4개 익명 질문, 읽음/안읽음 혼합 |
| 퀴즈 점수 | active + ended (quiz 있는 세션) | 정답 기반 점수 + 속도 보너스 + 티켓 자동 계산 |
