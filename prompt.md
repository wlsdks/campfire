# Pinggo Autonomous Improvement Cycle

> Cron every 20min. Design system & rules are in CLAUDE.md — read it every cycle.
> Focus: design quality > feature quantity. Each cycle = app gets visibly better.

## Cycle Workflow

### 0. Safety Check (FIRST)
```bash
cd /Users/jinan/ai/Pinggo
git status                    # Check for uncommitted changes from crashed cycle
```
- If dirty state exists: review changes → if they look intentional, commit them. If broken, `git checkout .` to restore.
- Ensure `npm run build` passes BEFORE starting new work. If not, fix first.

### 1. Read State
- Read `CLAUDE.md` (design system, architecture, anti-AI rules)
- Read `progress.md` → find next `[ ]` task
- Run `git log --oneline -10` → understand what was done in recent cycles (avoid duplication, maintain continuity)
- If the last cycle left WIP notes in progress.md, continue that work first

### 2. Execute
- Read source files BEFORE editing
- Follow design system from CLAUDE.md strictly — all colors from tokens, all icons from lucide-react
- Think: spacing, alignment, hierarchy, whitespace, consistency

### 3. Verify
```bash
cd /Users/jinan/ai/Pinggo && npm run build   # Must pass
```
- Start dev server if needed: `npm run dev` (background)
- CSS stale? → `rm -rf node_modules/.vite`, restart server
- **Playwright MCP**: screenshot at desktop (1280x800) + mobile (390x844)
- Ask: "Does this look like Toss/Linear or like an AI demo?" → iterate until real-product quality

### 4. Commit & Update
```bash
git add -A && git commit -m "style/feat/refactor: description"
```
- Update `progress.md`: mark `[x]`, add cycle log entry
- Spot inconsistency in existing code? Fix it (same cycle or note for next)

### 5. Error Recovery
If something goes wrong during the cycle:
- **Build fails and can't fix in 3 attempts** → revert changes (`git checkout .`), add note in progress.md, move to next task
- **Playwright can't connect** → skip visual verification for this cycle, note in log, but still do build check
- **Stuck on a task** → mark as `[~] WIP:` with notes, move on. Don't waste the whole cycle.
- **Dev server won't start** → `kill $(lsof -ti:5173) 2>/dev/null; rm -rf node_modules/.vite; npm run dev &`

### 6. Self-Improve (Optional, max 3 additions/cycle)
- Add learnings to `## Learnings` section below
- NEVER change baselines (colors, typography, architecture) in CLAUDE.md

---

## Phase Plan

### Phase 1: Foundation
- [ ] 1.0: Architecture migration → Bulletproof React structure + `@` path alias in vite.config.js
- [ ] 1.1: Install deps (lucide-react, lottie-react), add Pretendard + Inter fonts, create design-tokens.js
- [ ] 1.2: Shared UI components (Button variants, Card, Badge, IconButton, Skeleton)
- [ ] 1.3: Global styles + rename "shotshot" → "pinggo" everywhere

### Phase 2: Student Pages (Mobile-First)
- [ ] 2.1: JoinPage — centered card, clean input, avatar preview, entry animation
- [ ] 2.2: VotePage — question header, large vote buttons in thumb zone, tap feedback
- [ ] 2.3: Voters (Choice/OX/Text) — color-coded, smooth states, consistent feel
- [ ] 2.4: WaitingPage — ambient animation, participant count, session code
- [ ] 2.5: BottomBar + modals — lucide icons, polished interactions
- [ ] 2.6: VoteConfirm — Lottie checkmark, celebration, transition
- [ ] 2.R: **REVIEW** — screenshot all student pages, fix issues

### Phase 3: Admin Pages (Responsive)
- [ ] 3.1: AdminLogin — branded card, validation states
- [ ] 3.2: AdminPage layout — responsive columns, session info, presentation mode
- [ ] 3.3: QuestionManager — icon type selector, clean list, better form
- [ ] 3.4: Sidebar panels — avatar initials, actions, unread badges
- [ ] 3.5: Presentation mode — fullscreen, large fonts, keyboard hints
- [ ] 3.R: **REVIEW** — screenshot all admin pages at all viewports

### Phase 4: Visualizations
- [ ] 4.1: BarChart — smooth growth, percentage labels, responsive
- [ ] 4.2: OXBattle — split-screen, animated counters, winner
- [ ] 4.3: WordCloud — size distribution, smooth fade-in
- [ ] 4.4: QACards — card grid, typography, scroll
- [ ] 4.R: **REVIEW**

### Phase 5: Games
- [ ] 5.1: Roulette — smooth spin, confetti, name labels
- [ ] 5.2: Lottery — card flip, winner reveal, multi-winner
- [ ] 5.R: **REVIEW**

### Phase 6: Timer
- [ ] 6.1: Timer component (SVG ring, color transition, pulse at <5s)
- [ ] 6.2: Firebase sync + useTimer() hook
- [ ] 6.3: Admin controls (15/30/60/custom, start/pause/reset)
- [ ] 6.4: Student display (countdown, auto-lock on expiry)
- [ ] 6.R: **REVIEW**

### Phase 7: Reactions
- [ ] 7.1: Firebase model + useReactions() with rate limiting
- [ ] 7.2: ReactionBar (student) — icon buttons, cooldown, thumb zone
- [ ] 7.3: ReactionOverlay (admin) — floating bubbles, counts
- [ ] 7.4: Integration + polish
- [ ] 7.R: **REVIEW**

### Phase 8: Quiz Mode
- [ ] 8.1: Data model (isQuiz, correctAnswer, scores in Firebase)
- [ ] 8.2: Admin UI (quiz toggle, correct answer, reveal)
- [ ] 8.3: Student result (correct/wrong animation, points)
- [ ] 8.4: Leaderboard (top 5 podium, position animations)
- [ ] 8.5: Quiz flow polish (question → answer → leaderboard → next)
- [ ] 8.R: **REVIEW**

### Phase 9: Global Polish
- [ ] 9.1: Loading states (skeleton screens everywhere)
- [ ] 9.2: Error + empty states (friendly, illustrated)
- [ ] 9.3: Micro-interactions audit (every transition intentional)
- [ ] 9.4: Responsive audit (320/390/768/1024/1440px)
- [ ] 9.5: Animation performance (60fps, prefers-reduced-motion)
- [ ] 9.6: Presenter mode (dark/light, keyboard shortcuts)
- [ ] 9.7: Connection status (online/offline indicators)
- [ ] 9.R: **FINAL REVIEW**

---

## Review Cycle Checklist (for X.R tasks)
When a phase's REVIEW task comes up, check every page in that phase:

- [ ] Visual hierarchy clear? (headings > body > captions)
- [ ] Spacing consistent? No weird gaps or misalignments?
- [ ] Colors from design tokens only? Max 2-3 per screen?
- [ ] Icons all lucide-react, same size/stroke?
- [ ] Touch targets 48px+ on mobile?
- [ ] Looks like Toss/Linear, NOT like an AI demo?
- [ ] Animations purposeful, not excessive?
- [ ] Korean text readable? (line-height, font rendering)
- [ ] Works at 390px mobile AND 1280px desktop?

Fix ALL issues before marking the review [x].

---

## Learnings
> Add cycle learnings here. Max 3 per cycle. Keep concise.
