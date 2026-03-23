# 과제 심사 (Assignments) Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate ai-judge's AI evaluation system into Pick so students submit assignments via link, instructors run AI judging, and results are shared via live awards ceremony.

**Architecture:** Feature module `src/features/assignments/` with Firebase CRUD hooks, ported Gemini evaluation logic from ai-judge, and UI components for submission/judging/awards. Assignments belong to a courseName (Pick's implicit "class" concept). New `/submit` route for students, admin gets "과제" tab, presenter gets "시상식" mode.

**Tech Stack:** React 19, Firebase Realtime DB, Google Generative AI (Gemini 2.0 Flash), Framer Motion, Tailwind CSS v4

**Source reference:** `/Users/jinan/ai/ai-judge/src/lib/judges.js` and `/Users/jinan/ai/ai-judge/src/lib/gemini.js`

---

## File Map

### New files
```
src/features/assignments/
  api/
    judges.js                  ← 7 judge definitions (ported from ai-judge, emoji→initial avatar)
    gemini.js                  ← Gemini API evaluation (ported, adapted for Pick)
    useAssignments.js          ← Firebase CRUD for assignments
    useSubmissions.js          ← Firebase CRUD for submissions
    useJudging.js              ← Orchestrates judging flow + saves results
    useAwards.js               ← Award calculation + Firebase read
  components/
    AssignmentManager.jsx      ← Instructor: assignment list/create (admin "과제" tab)
    AssignmentDetail.jsx       ← Instructor: submission list + judging + results
    SubmissionPage.jsx         ← Student: public submit page (/submit route)
    SubmissionForm.jsx         ← Student: name/URL/file/description form
    SubmissionResult.jsx       ← Student: personal results + judge feedback
    JudgingPanel.jsx           ← Instructor: judging progress + controls
    JudgeResultCard.jsx        ← Single judge result display
    AwardsCeremony.jsx         ← Presenter: live awards ceremony
    AwardReveal.jsx            ← Single award reveal animation
src/app/routes/submit/
    SubmitPage.jsx             ← Route wrapper for /submit
```

### Modified files
```
src/App.jsx                    ← Add /submit route
database.rules.json            ← Add assignments rules under classes/
src/app/routes/admin/ModeSwitcher.jsx  ← Add "시상식" mode
src/app/routes/admin/PresentationView.jsx  ← Render AwardsCeremony for awards mode
src/app/routes/admin/AdminPage.jsx  ← Wire assignments to admin session
src/app/routes/admin/MobileAdminView.jsx  ← Add "과제" section
src/app/routes/live/LivePage.jsx  ← Support awards mode on live view
package.json                   ← Add @google/generative-ai dependency
```

---

## Task 1: Install dependency + Firebase rules

**Files:**
- Modify: `package.json`
- Modify: `database.rules.json`

- [ ] **Step 1: Install Google Generative AI SDK**

```bash
npm install @google/generative-ai
```

- [ ] **Step 2: Add Firebase rules for assignments**

In `database.rules.json`, add under the `sessions` node's `$sessionId` (since assignments are per-session's courseName, we store under a top-level `assignments` node keyed by a generated ID):

Add a new top-level `"assignments"` node next to `"sessions"`:

```json
"assignments": {
  "$assignmentId": {
    ".read": true,
    ".write": true,
    "submissions": {
      "$submissionId": {
        ".read": true,
        ".write": true
      }
    },
    "results": {
      "$submissionId": {
        ".read": true,
        ".write": true
      }
    },
    "awards": {
      ".read": true,
      ".write": true
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json database.rules.json
git commit -m "feat(assignments): add Gemini SDK + Firebase rules"
```

---

## Task 2: Port judge definitions + Gemini evaluation logic

**Files:**
- Create: `src/features/assignments/api/judges.js`
- Create: `src/features/assignments/api/gemini.js`

- [ ] **Step 1: Create judges.js**

Port from `/Users/jinan/ai/ai-judge/src/lib/judges.js`. Keep all 7 judges + AWARDS + systemPrompts exactly as-is. Remove emoji avatars (Pick uses initial-based avatars).

```javascript
// src/features/assignments/api/judges.js
// Copy JUDGES array, AWARDS array, getJudgeById, getAwardById from ai-judge
// Only change: remove 'avatar' emoji field (Pick uses initials)
```

- [ ] **Step 2: Create gemini.js**

Port from `/Users/jinan/ai/ai-judge/src/lib/gemini.js`. Adapt:
- Keep `initGemini`, `getStoredApiKey`, `isGeminiReady`, `evaluateSubmission`, `judgeSubmission`, `calculateAwards`
- Change `submission.cohort` references to use assignment context
- Keep the `EVALUATION_PROMPT` template
- Keep the JSON parsing with markdown cleanup
- Keep sequential execution for rate limiting

```javascript
// src/features/assignments/api/gemini.js
// Port from ai-judge, adapt submission shape:
// - submission.name (same)
// - submission.projectUrl (new — fetch HTML if URL provided)
// - submission.fileContent (same as htmlContent)
// - submission.description (new — optional text)
```

Key adaptation in `evaluateSubmission`: if `submission.projectUrl` is provided and `fileContent` is empty, include the URL in the prompt instead of HTML code.

- [ ] **Step 3: Verify imports work**

```bash
npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/features/assignments/api/judges.js src/features/assignments/api/gemini.js
git commit -m "feat(assignments): port judge definitions + Gemini evaluation from ai-judge"
```

---

## Task 3: Firebase hooks — useAssignments + useSubmissions

**Files:**
- Create: `src/features/assignments/api/useAssignments.js`
- Create: `src/features/assignments/api/useSubmissions.js`

- [ ] **Step 1: Create useAssignments.js**

```javascript
// CRUD for assignments node in Firebase
// createAssignment(courseName, { title, description }) → assignmentId
// useAssignmentList(courseName) → { assignments, loading }
// useAssignment(assignmentId) → { assignment, loading }
// updateAssignment(assignmentId, data)
// deleteAssignment(assignmentId)
```

Data stored at: `assignments/{assignmentId}` with fields: `title, description, courseName, status, createdAt`

- [ ] **Step 2: Create useSubmissions.js**

```javascript
// CRUD for submissions under an assignment
// submitWork(assignmentId, { name, projectUrl, fileContent, fileName, description }) → submissionId
// useSubmissionList(assignmentId) → { submissions, loading }
// useSubmission(assignmentId, submissionId) → { submission }
// findSubmissionByName(assignmentId, name) → submission or null
```

Data stored at: `assignments/{assignmentId}/submissions/{submissionId}`

- [ ] **Step 3: Build check**

```bash
npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/features/assignments/api/useAssignments.js src/features/assignments/api/useSubmissions.js
git commit -m "feat(assignments): Firebase hooks for assignments + submissions"
```

---

## Task 4: Judging hook — useJudging

**Files:**
- Create: `src/features/assignments/api/useJudging.js`
- Create: `src/features/assignments/api/useAwards.js`

- [ ] **Step 1: Create useJudging.js**

```javascript
// Orchestrates the judging flow
// useJudging(assignmentId) → { startJudging, progress, isJudging, abort }
//
// startJudging():
//   1. Fetch all submissions for the assignment
//   2. For each submission: call judgeSubmission() from gemini.js
//   3. Save results to Firebase: assignments/{id}/results/{submissionId}
//   4. Update progress state: { current, total, currentJudge, currentSubmission }
//   5. After all: calculate awards, save to Firebase, update assignment status to "judged"
```

- [ ] **Step 2: Create useAwards.js**

```javascript
// useAwards(assignmentId) → { awards, loading }
// Listens to assignments/{id}/awards in Firebase
// Also exports calculateAndSaveAwards(assignmentId) for use after judging
```

- [ ] **Step 3: Build check**

```bash
npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/features/assignments/api/useJudging.js src/features/assignments/api/useAwards.js
git commit -m "feat(assignments): judging orchestration + awards calculation hooks"
```

---

## Task 5: Student submission page (/submit route)

**Files:**
- Create: `src/app/routes/submit/SubmitPage.jsx`
- Create: `src/features/assignments/components/SubmissionPage.jsx`
- Create: `src/features/assignments/components/SubmissionForm.jsx`
- Create: `src/features/assignments/components/SubmissionResult.jsx`
- Modify: `src/App.jsx` — add `/submit` route

- [ ] **Step 1: Create SubmissionForm.jsx**

Student form with:
- 이름 (text, required)
- 프로젝트 URL (text, optional)
- 파일 업로드 (file input, optional — reads as text)
- 설명 (textarea, optional)
- Validation: at least URL or file required
- Mobile-first design (px-5, text-[16px], py-4 inputs)

- [ ] **Step 2: Create SubmissionResult.jsx**

Shows after judging is complete:
- Average score (big number)
- Pass/fail badge
- 7 JudgeResultCard components (reuse from Task 6)
- Award badge if student won something

- [ ] **Step 3: Create SubmissionPage.jsx**

Main page logic:
- Reads `assignmentId` from URL params
- Shows assignment title/description
- If status=open: show SubmissionForm
- If status=judged + student enters name: show SubmissionResult
- If already submitted (name match): show "수정/재제출" option

- [ ] **Step 4: Create SubmitPage.jsx route wrapper**

```jsx
// src/app/routes/submit/SubmitPage.jsx
import { useSearchParams } from 'react-router-dom';
import SubmissionPage from '@/features/assignments/components/SubmissionPage';

export default function SubmitPage() {
  const [params] = useSearchParams();
  const assignmentId = params.get('a');
  if (!assignmentId) return <div>잘못된 링크입니다</div>;
  return <SubmissionPage assignmentId={assignmentId} />;
}
```

- [ ] **Step 5: Add route to App.jsx**

Add `<Route path="/submit" element={<SubmitPage />} />` to the router.

- [ ] **Step 6: Build + visual check**

```bash
npx vite build
```

Navigate to `http://localhost:5173/submit?a=test` to verify page renders.

- [ ] **Step 7: Commit**

```bash
git add src/app/routes/submit/ src/features/assignments/components/SubmissionPage.jsx src/features/assignments/components/SubmissionForm.jsx src/features/assignments/components/SubmissionResult.jsx src/App.jsx
git commit -m "feat(assignments): student submission page with /submit route"
```

---

## Task 6: Judge result display components

**Files:**
- Create: `src/features/assignments/components/JudgeResultCard.jsx`
- Create: `src/features/assignments/components/JudgingPanel.jsx`

- [ ] **Step 1: Create JudgeResultCard.jsx**

Display one judge's evaluation:
- Judge initial avatar (from name, using Pick's Avatar component) + name + role
- Score (big number) + selected badge
- Comment text
- Strengths (slate tags)
- Improvements (outline tags)
- Follow Pick design system: shadow-sm card, no border

- [ ] **Step 2: Create JudgingPanel.jsx**

Instructor-facing judging control:
- API key input (first time) with test button
- "심사 시작" button
- Progress bar: "김기획이 3번째 제출물 심사 중... (5/21)"
- Abort button
- On complete: show results summary

- [ ] **Step 3: Build check**

```bash
npx vite build
```

- [ ] **Step 4: Commit**

```bash
git add src/features/assignments/components/JudgeResultCard.jsx src/features/assignments/components/JudgingPanel.jsx
git commit -m "feat(assignments): judge result cards + judging progress panel"
```

---

## Task 7: Instructor assignment management (admin integration)

**Files:**
- Create: `src/features/assignments/components/AssignmentManager.jsx`
- Create: `src/features/assignments/components/AssignmentDetail.jsx`
- Modify: `src/app/routes/admin/AdminPage.jsx` — add assignments tab/section
- Modify: `src/app/routes/admin/MobileAdminView.jsx` — add assignments in settings or as tab

- [ ] **Step 1: Create AssignmentManager.jsx**

List view for instructor:
- "새 과제" button → inline form (title + description)
- Assignment cards: title, status badge, submission count, created date
- Click → AssignmentDetail view
- Link copy button per assignment

- [ ] **Step 2: Create AssignmentDetail.jsx**

Detail view:
- Assignment header (title, status, link copy)
- Submission list (name, time, preview toggle)
- JudgingPanel integration
- Results table (if judged): ranking, scores, pass/fail
- CSV export button

- [ ] **Step 3: Wire into AdminPage**

Add assignments section accessible from the admin session view. Since assignments belong to a courseName, show the assignment manager when viewing a class. Add to the existing class management area or as a new section in the admin layout.

- [ ] **Step 4: Wire into MobileAdminView**

Add "과제" as accessible from the settings BottomSheet or as a dedicated section.

- [ ] **Step 5: Build + test**

```bash
npx vite build
```

- [ ] **Step 6: Commit**

```bash
git add src/features/assignments/components/AssignmentManager.jsx src/features/assignments/components/AssignmentDetail.jsx src/app/routes/admin/AdminPage.jsx src/app/routes/admin/MobileAdminView.jsx
git commit -m "feat(assignments): instructor assignment management in admin"
```

---

## Task 8: Awards ceremony mode (presenter/live)

**Files:**
- Create: `src/features/assignments/components/AwardsCeremony.jsx`
- Create: `src/features/assignments/components/AwardReveal.jsx`
- Modify: `src/app/routes/admin/ModeSwitcher.jsx` — add "시상식"
- Modify: `src/app/routes/admin/PresentationView.jsx` — render AwardsCeremony
- Modify: `src/app/routes/live/LivePage.jsx` — support awards mode

- [ ] **Step 1: Create AwardReveal.jsx**

Single award reveal animation:
- Card starts face-down (slate-900 bg, "?")
- On reveal: flip animation → show winner name + score + award name
- Confetti burst (reuse ConfettiBurst component)
- Grand prize gets larger animation + more confetti

- [ ] **Step 2: Create AwardsCeremony.jsx**

Full ceremony screen:
- Dark background (stage feel)
- Title: "시상식" + assignment name
- "다음 발표" button (instructor controls)
- Current award reveal area
- Previously announced winners list at bottom
- Sequence: 기획상→창의상→디자인상→실용상→우수상→최우수상→대상
- State machine: idle → revealing → revealed, advances per button click

- [ ] **Step 3: Add "시상식" to ModeSwitcher**

Add `{ mode: 'awards', label: '시상식', icon: Trophy }` to the modes list. Only show when there are judged assignments.

- [ ] **Step 4: Add AwardsCeremony to PresentationView**

In `MainContent`, add:
```jsx
if (currentMode === 'awards') return <AwardsCeremony assignmentId={...} />;
```

Need to pass the selected assignment ID. Store in Firebase session state or use a selection modal.

- [ ] **Step 5: Add to LivePage**

Same as PresentationView — when `currentMode === 'awards'`, render AwardsCeremony in read-only mode (no "다음 발표" button, auto-follows instructor's progress via Firebase).

- [ ] **Step 6: Build + visual check**

```bash
npx vite build
```

- [ ] **Step 7: Commit**

```bash
git add src/features/assignments/components/AwardsCeremony.jsx src/features/assignments/components/AwardReveal.jsx src/app/routes/admin/ModeSwitcher.jsx src/app/routes/admin/PresentationView.jsx src/app/routes/live/LivePage.jsx
git commit -m "feat(assignments): awards ceremony mode on presenter + live view"
```

---

## Task 9: End-to-end verification

- [ ] **Step 1: Create test assignment via admin**
- [ ] **Step 2: Open /submit link, submit as student**
- [ ] **Step 3: Run judging from admin (needs real Gemini API key)**
- [ ] **Step 4: View results on student page**
- [ ] **Step 5: Run awards ceremony on presenter**
- [ ] **Step 6: Verify mobile views (390x844)**
- [ ] **Step 7: Final build + push**

```bash
npx vite build && git push
```

---

## Design Checklist (apply to ALL new components)

```
□ shadow-sm only, no border+shadow together
□ text-xl+ font-bold → tracking-tight
□ spring presets: 300/25, 200/20, 400/22, 500/30 only
□ transition-colors duration-150 on all interactive elements
□ Mobile-first: text-[15px]+ body, 44px+ touch targets
□ Korean text only, Pretendard font
□ CTA: bg-slate-900, NOT bg-indigo-600
□ No emoji — use lucide-react icons or initial avatars
□ Cards: bg-white rounded-xl shadow-sm p-5
```
