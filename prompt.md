# Pinggo Background Improvement Loop

> 15분 간격 자동 실행. CLAUDE.md의 디자인 시스템/규칙을 매 사이클 참조.
> 브랜치: `background-improve`에서만 작업. main은 절대 건드리지 않음.

## 브랜치 규칙

- **작업 브랜치**: `background-improve` (이 브랜치에서만 커밋/푸시)
- **서브에이전트 worktree**: 사용 가능하나, 작업 완료 후 반드시 `background-improve`에 merge
- **main 브랜치**: 절대 직접 커밋/푸시하지 않음 (사용자가 직접 관리)
- **다른 브랜치 생성 금지**: worktree 임시 브랜치 외에 새 브랜치 만들지 않음
- **충돌 발생 시**: 반드시 해결 후 merge. 해결 못하면 해당 작업 버리고 다음으로

## 사이클 워크플로우

### 0. 안전 점검
```bash
cd /Users/jinan/ai/Pinggo
git checkout background-improve
git status                    # 이전 사이클 미커밋 변경 확인
npm run build                 # 빌드 통과 확인
```
- dirty state → 의도적이면 커밋, 깨졌으면 `git checkout .`
- 빌드 실패 → 먼저 수정

### 1. 상태 파악
- `CLAUDE.md` 읽기 (디자인 시스템, 안티-AI 규칙)
- `git log --oneline -10` → 최근 작업 파악 (중복 방지)
- Playwright로 앱 현재 상태 확인 (http://localhost:5173)

### 2. 개선 실행
- 한 사이클에 **한 가지 개선에 집중** (여러 개 동시에 건드리지 않기)
- 소스 파일 읽고 나서 수정
- CLAUDE.md 디자인 시스템 엄격 준수

### 3. 검증
```bash
npm run build   # 반드시 통과
```
- Playwright 스크린샷으로 시각적 확인
- "토스/Linear처럼 보이는가, AI 데모처럼 보이는가?" 자문

### 4. 커밋 & 푸시
```bash
git add -A && git commit -m "improve: 설명"
git push origin background-improve
```

### 5. 에러 복구
- 빌드 3회 실패 → `git checkout .`, 다음 사이클로
- Playwright 연결 실패 → 시각적 검증 스킵, 빌드만 확인
- 막히면 → 포기하고 다음 사이클로. 한 사이클 낭비하지 않기

## 서브에이전트 활용

적극 활용 권장:
- **Research agent**: 디자인 레퍼런스, UX 패턴, 라이브러리 문서 조사
- **Explore agent**: 코드베이스 분석, 패턴 찾기, 의존성 추적
- **Code review agent**: 변경 후 품질 검토
- **git worktree**: 병렬 작업 (완료 후 `background-improve`에 merge)

## 개선 카테고리 (순환 선택)

1. **디자인 디테일**: 정렬, 색상, 그림자/보더 일관성, hover/active 상태, 마이크로 인터랙션
2. **UX 개선**: 사용자 흐름, 에러 메시지, 빈 상태, 로딩 경험, 접근성
3. **코드 품질**: 큰 컴포넌트 분리(200줄 초과), 중복 제거, 성능 최적화
4. **기능 고도화**: 애니메이션 타이밍, 전환 효과, 엣지케이스 처리
5. **신규 기능**: 정말 가치 있는 것만, 한 사이클에 하나씩, 신중하게

## 페르소나 (작업 시 반드시 해당 관점에서 생각)

- **학생 페이지** → "나는 수업 중 한 손으로 폰 잡고 있는 학생"
- **강사 페이지** → "나는 학생들 앞에서 수업 진행 중인 강사"
- **프레젠터 화면** → "나는 강의실 뒷자리에서 프로젝터 보는 학생"
