# Slack 연동 기획서

> 작성일: 2026-03-23 | 상태: 검토 중

## 목표

학습자가 Q&A 보드에 사후 질문을 올리면 Slack 채널로 자동 전송.
강사/스태프가 Slack에서 답변하면 Q&A 보드에도 반영.

## 사용자 플로우

```
[관리자 설정]
  관리자 → 더보기/설정 → Slack Bot 연결 (OAuth)
  → Bot Token 저장 (Firebase 또는 서버)

[수업별 설정]
  강사 → 세션 설정 → Slack 채널 입력 (#바이브코딩-3차)
  → 해당 세션의 classQuestions가 이 채널로 전송

[실시간 연동]
  학생이 질문 작성 → Firebase에 저장 → Cloud Function 트리거
  → Slack 채널에 메시지 전송 (질문 내용 + 닉네임 + 좋아요 수)

  누군가 답변 작성 → Firebase에 저장 → Cloud Function 트리거
  → Slack 스레드에 답변 추가

  (선택) Slack에서 답변 → Slack Event → Cloud Function
  → Firebase classQuestions에 답변 추가
```

## 구현 방식 비교

| 방식 | 장점 | 단점 | 비용 |
|------|------|------|------|
| **A) Firebase Cloud Functions** | 서버 관리 불필요, DB 트리거 자동 실행 | Blaze 플랜 전환 필수 (카드 등록) | 거의 0원 (월 200만 회 무료) |
| **B) Cloudflare Workers** | 완전 무료 (일 10만 회), Blaze 불필요 | 별도 서비스 관리 | 무료 |
| **C) 별도 백엔드 서버** | 자유도 높음 | 과잉 — 서버 운영 부담 | 월 $5~20 |

### 추천: A (Firebase Cloud Functions)

- 현재 아키텍처와 가장 자연스러움
- Realtime DB 트리거 (`onWrite`)로 질문/답변 생성 시 자동 실행
- Blaze 플랜은 카드 등록만 하면 됨 (실제 과금은 무료 한도 초과 시에만)
- 수업 1회 30명, 질문 20개 기준 → 사실상 0원

## 필요한 작업

### Phase 1: 기본 연동 (질문 → Slack)

```
1. Firebase Blaze 플랜 전환
2. Cloud Functions 프로젝트 초기화 (functions/ 디렉토리)
3. Slack App 생성 (api.slack.com)
   - Bot Token Scopes: chat:write, channels:read
   - Incoming Webhook 또는 Bot Token 방식
4. Cloud Function 작성:
   - 트리거: sessions/{sid}/classQuestions/{qid} onCreate
   - 동작: Slack API chat.postMessage 호출
5. 관리자 설정 UI:
   - Slack Bot Token 입력 (또는 OAuth 연결)
   - 세션별 Slack 채널 설정
6. Firebase에 설정 저장:
   - admins/{uid}/slackConfig: { botToken, defaultChannel }
   - sessions/{sid}/slackChannel: "#채널명"
```

### Phase 2: 양방향 연동 (Slack → Q&A 보드)

```
1. Slack Event Subscription 설정
   - Cloud Function 엔드포인트를 Slack Event URL로 등록
2. message 이벤트 수신 → Firebase classQuestions에 답변 추가
3. 스레드 매핑: Slack thread_ts ↔ Firebase questionId 매핑 테이블
```

### Phase 3: 고급 기능

```
- Slack에서 이모지 반응 → Q&A 보드 좋아요 동기화
- 질문 답변 완료 시 Slack 메시지 업데이트 (✅ 표시)
- 주간 질문 요약 리포트 자동 발송
```

## 보안 고려사항

- Bot Token은 **절대 클라이언트에 노출하면 안 됨**
- Firebase Cloud Functions 환경변수 또는 Secret Manager에 저장
- Slack Webhook URL도 서버사이드에서만 사용

## 참고 자료

- [Slack Bot 생성 가이드](https://api.slack.com/bot-users)
- [Firebase Cloud Functions 문서](https://firebase.google.com/docs/functions)
- [Slack chat.postMessage API](https://api.slack.com/methods/chat.postMessage)

## 예상 메시지 형식

```
📋 새 질문 | 바이브코딩 워크숍 3차

> React 19의 use 훅이 뭔가요?

👤 김민수 | 👍 3 | 💬 1개 답변
🔗 Pick에서 보기: https://pick.app/live?s=xxx
```

```
💬 답변 | React 19의 use 훅이 뭔가요?

> use 훅은 Promise를 직접 읽을 수 있게 해주는 새 훅입니다

👤 강사
```
