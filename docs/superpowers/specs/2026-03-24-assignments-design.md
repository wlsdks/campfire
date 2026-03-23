# 과제 심사 (Assignments) 기능 설계

> Pick 클래스 내 사후 과제 제출 + AI 심사 + 시상식 기능.
> ai-judge 프로젝트의 심사 로직을 Pick에 통합.

## 1. 개요

### 문제
현장 강의 후 학생들이 과제를 제출하고, 강사가 AI로 심사하여 결과를 공유하는 워크플로우가 없다. 기존 ai-judge는 독립 앱으로 강사가 대신 업로드해야 했다.

### 해결
Pick 클래스에 과제 기능을 통합하여:
- 학생이 직접 링크로 제출
- 강사가 원클릭으로 AI 심사 실행
- 프레젠터에서 드라마틱한 시상식 연출
- 학생이 본인 피드백을 직접 확인

### 범위
- 과제 CRUD (생성/수정/삭제/마감)
- 학생 제출 (URL + 파일 + 설명)
- 7명 AI 심사위원 평가 (Gemini 2.0 Flash)
- 시상 계산 (대상/최우수/우수 + 특별상 4종)
- 시상식 모드 (프레젠터 라이브 연출)
- 학생 결과 확인 (같은 제출 링크에서)

---

## 2. 사용자 흐름

### 강사 흐름
```
클래스 관리 → "과제" 탭 → "새 과제" 생성
  → 제목, 설명, 마감일(선택) 입력
  → 제출 링크 자동 생성 → 복사 버튼
  → 스태프가 학생들에게 링크 공유

제출 현황 확인
  → 실시간 제출 수 카운트
  → 제출자 목록 (이름, 제출 시간, 미리보기)

심사 실행
  → "심사 시작" 버튼 → Gemini API 키 입력 (최초 1회)
  → 7명 심사위원 × 제출물 수 순차 평가
  → 진행률 바 실시간 표시 (현재 N/전체 M, 심사위원 이름)
  → 완료 후 결과 즉시 확인 가능

결과 확인
  → 제출물별: 평균 점수, 합격/불합격, 선택 수
  → 심사위원별: 점수, 코멘트, 강점, 개선점
  → 전체 랭킹 테이블
  → CSV/JSON 내보내기

시상식
  → 모드 드롭다운에서 "시상식" 선택
  → 과제 선택 → 프레젠터에 시상식 연출 시작
```

### 학생 흐름
```
링크 접속: pick.kr/submit?c={classCode}&a={assignmentId}

제출 전 (status: open)
  → 과제 제목/설명 확인
  → 이름 입력 (필수)
  → 프로젝트 URL 입력 (선택, GitHub/배포 링크 등)
  → 파일 업로드 (선택, HTML/ZIP/PDF 등)
  → 설명 텍스트 (선택)
  → URL 또는 파일 중 최소 하나 필수
  → "제출" → 완료 확인 애니메이션
  → 재접속 시 수정/재제출 가능 (이름으로 식별)

심사 후 (status: judged)
  → 같은 링크에서 본인 이름 입력 → 결과 확인
  → 평균 점수, 합격 여부
  → 심사위원별 피드백 (점수, 코멘트, 강점, 개선점)
  → 시상 수상 시 배지 표시
```

### 프레젠터 흐름 (시상식)
```
강사가 "시상식" 모드 선택 → 과제 선택
→ 전자칠판/프레젠터에 시상식 화면

발표 순서:
  1. 특별상 (기획상 → 창의상 → 디자인상 → 실용상)
  2. 우수상 (3위)
  3. 최우수상 (2위)
  4. 대상 (1위)

각 발표:
  → "다음 발표" 버튼 → 봉투/카드 오픈 애니메이션
  → 이름 reveal + 점수 표시
  → confetti + 축하 효과
  → 학생 화면: 본인이면 축하 오버레이
```

---

## 3. 데이터 모델 (Firebase)

### 과제
```
classes/{classId}/assignments/{assignmentId}
  title: string              // "3주차 과제"
  description: string        // "바이브코딩으로 웹서비스를 만들어주세요"
  status: "open" | "closed" | "judging" | "judged"
  createdAt: serverTimestamp
  closedAt: timestamp | null
  judgedAt: timestamp | null
```

### 제출물
```
classes/{classId}/assignments/{assignmentId}/submissions/{submissionId}
  name: string               // 학생 이름
  projectUrl: string | null  // GitHub/배포 URL
  fileContent: string | null // 업로드된 파일 내용
  fileName: string | null    // 원본 파일명
  description: string | null // 부가 설명
  submittedAt: serverTimestamp
  updatedAt: serverTimestamp | null
```

### 심사 결과
```
classes/{classId}/assignments/{assignmentId}/results/{submissionId}
  judges:
    {judgeId}:               // 7명 각각
      score: number (1-10)
      selected: boolean
      comment: string
      strengths: string[]
      improvements: string[]
  summary:
    avgScore: number
    selectedCount: number
    totalJudges: 7
    passed: boolean          // selectedCount >= 3
  judgedAt: serverTimestamp
```

### 시상
```
classes/{classId}/assignments/{assignmentId}/awards
  grand: submissionId        // 대상 (1위)
  excellence: submissionId   // 최우수상 (2위)
  outstanding: submissionId  // 우수상 (3위)
  planning: submissionId     // 기획상 (김기획 최고점)
  creative: submissionId     // 창의상 (정창의 최고점)
  design: submissionId       // 디자인상 (이디자 최고점)
  practical: submissionId    // 실용상 (최실용 최고점)
```

### Firebase Rules 추가
```json
"assignments": {
  "$assignmentId": {
    ".read": true,
    ".write": "auth != null || !data.exists()",
    "submissions": {
      "$submissionId": {
        ".read": true,
        ".write": true
      }
    },
    "results": {
      ".read": true,
      ".write": "auth != null"
    },
    "awards": {
      ".read": true,
      ".write": "auth != null"
    }
  }
}
```

---

## 4. 심사 시스템

### ai-judge에서 이식하는 것
- `lib/judges.js` → 7명 심사위원 정의 (이름, 역할, 성격, 평가 기준, 색상)
- `lib/gemini.js` → Gemini API 호출 로직, 프롬프트 구성, JSON 파싱
- 시상 계산 로직 (상위 3명 + 특별상 4종)

### 변경점
- localStorage → Firebase (결과 저장)
- 회차(cohort) → 과제(assignmentId)
- 강사가 업로드 → 학생이 직접 제출
- URL 제출 지원: URL이면 fetch로 HTML 가져와서 심사 입력으로 사용
- API 키: 강사 localStorage에 저장 (기존 ai-judge 방식 유지, 서버 불필요)

### 심사 흐름
```
강사: "심사 시작" 클릭
  → 미심사 제출물 목록 가져오기
  → 각 제출물마다:
      → URL이면: fetch로 HTML 가져오기
      → 파일이면: fileContent 사용
      → 7명 심사위원 순차 호출 (Gemini 2.0 Flash)
      → 결과를 Firebase에 저장
      → 진행률 업데이트
  → 전체 완료 후 시상 계산 → awards에 저장
  → status를 "judged"로 변경
```

### 심사위원 7명 (ai-judge 그대로)
| ID | 이름 | 역할 | 평가 초점 |
|----|------|------|-----------|
| kim-gihoek | 김기획 | 시니어 PM | 문제 정의, PRD 완성도 |
| park-sayong | 박사용 | 깐깐한 사용자 | UX, 직관성 |
| lee-dija | 이디자 | 공감 디자이너 | 시각적 완성도, 레이아웃 |
| choi-silyong | 최실용 | 실용주의 팀장 | 실제 활용 가능성 |
| jung-changui | 정창의 | 비전 파운더 | 아이디어 독창성 |
| han-wansung | 한완성 | 꼼꼼한 QA | 기능 완성도, 버그 |
| kang-sotong | 강소통 | 따뜻한 교육자 | AI 협업 품질, 성장 |

### 합격 기준
- 7명 중 3명 이상이 `selected: true` → 합격
- 점수: 1-10 (평균 산출)

### 시상 로직
- 대상/최우수/우수: avgScore 상위 3명 (중복 불가)
- 기획상: 김기획 최고점 (상위 3명 제외)
- 창의상: 정창의 최고점 (기수상 제외)
- 디자인상: 이디자 최고점 (기수상 제외)
- 실용상: 최실용 최고점 (기수상 제외)

---

## 5. 라우트

| 경로 | 용도 | 접근 |
|------|------|------|
| `/submit?c={classCode}&a={assignmentId}` | 과제 제출 + 결과 확인 | 누구나 (링크 공유) |
| `/admin` → 클래스 → "과제" 탭 | 과제 관리/심사/결과 | 강사 |
| 프레젠터 모드 → "시상식" | 라이브 시상식 연출 | 강사 (모드 전환) |

---

## 6. 코드 구조

```
src/features/assignments/
  api/
    useAssignments.js         // 과제 CRUD (Firebase)
    useSubmissions.js          // 제출물 CRUD (Firebase)
    useJudging.js              // Gemini 심사 실행 + 결과 저장
    useAwards.js               // 시상 계산 + 조회
    judges.js                  // 7명 심사위원 정의 (ai-judge에서 이식)
    gemini.js                  // Gemini API 호출 (ai-judge에서 이식)
  components/
    AssignmentManager.jsx      // 강사: 과제 목록/생성/삭제
    AssignmentDetail.jsx       // 강사: 제출 현황 + 심사 실행 + 결과
    SubmissionPage.jsx         // 학생: 제출 폼 + 결과 확인 (공개 페이지)
    SubmissionForm.jsx         // 학생: 이름/URL/파일/설명 입력 폼
    SubmissionResult.jsx       // 학생: 본인 심사 결과 + 심사위원 피드백
    JudgingPanel.jsx           // 강사: 심사 진행률 + 실행 제어
    JudgeResultCard.jsx        // 심사위원 1명 결과 카드
    AwardsCeremony.jsx         // 프레젠터: 시상식 연출 화면
    AwardReveal.jsx            // 시상식: 개별 수상자 reveal 애니메이션
    AwardResultOverlay.jsx     // 학생: 수상 축하 오버레이
```

### 기존 코드 수정
- `ModeSwitcher.jsx` — "시상식" 모드 추가
- `PresentationView.jsx` — `currentMode === 'awards'` → AwardsCeremony 렌더링
- `App.jsx` — `/submit` 라우트 추가
- `database.rules.json` — assignments 규칙 추가

---

## 7. 시상식 연출 (프레젠터)

### 화면 구성
```
[배경: 어두운 무대 느낌, subtle gradient]

 ┌─────────────────────────────────────┐
 │        🏆 시상식                      │
 │        "3주차 과제"                   │
 │                                      │
 │    [ 다음 발표 ]                      │
 │                                      │
 │    현재: "기획상" (특별상 1/4)         │
 │                                      │
 │    ┌─────────────────────┐           │
 │    │  봉투 오픈 애니메이션  │           │
 │    │    → 이름 reveal     │           │
 │    │    → 점수 + 코멘트   │           │
 │    └─────────────────────┘           │
 │                                      │
 │    하단: 이미 발표된 수상자 목록       │
 └─────────────────────────────────────┘
```

### 발표 순서 (7단계)
1. 기획상 → 2. 창의상 → 3. 디자인상 → 4. 실용상
5. 우수상 → 6. 최우수상 → 7. 대상

### 애니메이션
- 카드 flip + scale-up → 이름 reveal
- confetti burst (대상은 더 화려하게)
- 발표 사이 pause — 강사가 "다음 발표" 클릭으로 진행
- 학생 화면: 본인 수상 시 GameResultOverlay 패턴 재사용

---

## 8. 디자인 원칙

- Pick 디자인 시스템 100% 준수 (CLAUDE.md + DESIGN_SYSTEM.md)
- 제출 페이지: 모바일 우선 (학생은 폰으로 접속)
- 심사 결과: 심사위원 아바타는 이니셜 + 색상 (기존 ai-judge의 이모지 제거)
- 시상식: 프로젝터 최적화 (큰 글자, 높은 대비, 뒷자리에서도 보임)
- 색상: slate 모노크롬 + indigo 악센트만

---

## 9. 제외 사항 (YAGNI)

- 학생 계정/로그인 (운영으로 해결)
- 파일 서버 업로드 (fileContent를 Firebase에 직접 저장, 대용량은 URL로)
- 심사위원 커스터마이징 (7명 고정)
- 실시간 심사 결과 스트리밍 (심사 완료 후 일괄 표시)
- 과제 간 점수 비교 (과제별 독립)
