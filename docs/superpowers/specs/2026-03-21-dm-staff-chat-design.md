# DM + 운영 채팅 설계

> 2026-03-21 확정. 학생↔스태프 1:1 DM + 스태프/강사 내부 채팅.

## 채널 구조

| 채널 | 참여자 | 용도 |
|------|--------|------|
| 공개 채팅 (기존) | 학생+스태프+강사 | 수업 중 소통 |
| 운영 채팅 (신규) | 스태프+강사만 | 내부 조율 |
| 1:1 DM (신규) | 학생↔스태프 | 개별 도움 요청 |

## Firebase 데이터 구조

```
sessions/{sessionId}/
  chat/                    ← 기존 공개 채팅
  staffChat/               ← 운영 채팅
    {msgId}: { text, senderName, senderType, timestamp }
  dm/
    {dmId}/
      studentId: string
      staffId: string | null (미배정)
      status: "waiting" | "active" | "resolved"
      studentName: string
      staffName: string | null
      createdAt: number
      messages/
        {msgId}: { text, senderId, senderName, senderType, timestamp }
```

## 학생 화면
- 하단 바 "도움 요청" 버튼 → 모달로 메시지 입력
- 전송 시 dm/{dmId} 생성 (status: waiting)
- 스태프 응답 시 DM 버블 하단 표시 → 1:1 대화

## 스태프 화면
- 새 DM 도착 시 상단 플로팅 알림 버블 (확인까지 유지)
- "응답" → staffId 배정 + DM 채팅 열림
- "확인" → 알림 닫힘 (대면 도움)

## 강사/스태프 채팅 UI
- ChatPanel 탭: [전체 채팅 | 운영 채팅]
- DM 알림은 별도 플로팅 (채팅 패널과 독립)

## 권한
| 기능 | 학생 | 스태프 | 강사 |
|------|------|--------|------|
| 공개 채팅 | ✅ | ✅ | ✅ |
| 운영 채팅 | ❌ | ✅ | ✅ |
| DM 요청 | ✅ | ❌ | ❌ |
| DM 응답 | ❌ | ✅ | ✅ |

## 컴포넌트 구조
```
src/features/dm/
  api/useDM.js
  api/useStaffChat.js
  components/
    HelpRequestModal.jsx
    DMBubble.jsx
    StaffDMAlert.jsx
    StaffDMChat.jsx
    StaffChatTab.jsx
```
