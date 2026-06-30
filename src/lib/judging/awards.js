/**
 * 시상 계산 — 순수 함수. Gemini 호출 없음.
 */

/**
 * Live top-3 calculation. allResults shape:
 * [{ submissionId, name, results, summary }]
 * Returns { first, second, third } each { submissionId, name, score, comment }.
 */
export function calculateLiveTop3(allResults) {
  if (!allResults.length) return {};
  // 모든 판사가 실패한 제출(totalJudges === 0)은 순위에서 제외 — 아니면 0점 제출이 3등으로 들어올 수 있음.
  const valid = allResults.filter(r => (r.summary?.totalJudges ?? 0) > 0);

  // 결정적 정렬 — 동점 시 계산마다 순위가 달라지는 것을 방지. 타이브레이커:
  //   1) avgScore 내림차순
  //   2) 최고 점수(best judge score) 내림차순 — 더 인상적 심사 받은 쪽 우선
  //   3) 이름 가나다/알파벳 오름차순 — 완전 동점이어도 결정적
  const topJudgeScore = (entry) => {
    const scores = Object.values(entry.results).filter(r => !r.error).map(r => r.score || 0);
    return scores.length ? Math.max(...scores) : 0;
  };
  const sorted = [...valid].sort((a, b) => {
    const avgDiff = b.summary.avgScore - a.summary.avgScore;
    if (avgDiff !== 0) return avgDiff;
    const topDiff = topJudgeScore(b) - topJudgeScore(a);
    if (topDiff !== 0) return topDiff;
    return (a.name || '').localeCompare(b.name || '');
  });
  const rankKeys = ['first', 'second', 'third'];
  const top = {};

  sorted.slice(0, 3).forEach((entry, i) => {
    if (!rankKeys[i]) return;
    const valid = Object.values(entry.results).filter(r => !r.error);
    // Representative comment: highest-scoring judge's comment
    const best = valid.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
    top[rankKeys[i]] = {
      submissionId: entry.submissionId,
      name: entry.name,
      score: entry.summary.avgScore,
      topScore: best?.score || 0,
      comment: best?.comment || '',
      highlight: best?.highlight || '',
      bestJudgeId: best?.judgeId || null,
      bestJudgeName: best?.judgeName || null,
    };
  });
  return top;
}

/**
 * Calculate awards from all judged results.
 */
export function calculateAwards(allResults) {
  if (!allResults.length) return {};

  // 전 판사 실패(totalJudges=0) 제출은 순위에서 제외 — calculateLiveTop3와 동일 기준.
  // (점수 없는 제출이 0점으로 상위권에 끼어 시상되는 정합성 오류 방지)
  const valid = allResults.filter((r) => (r.summary?.totalJudges ?? 0) > 0);
  if (!valid.length) return {};

  const awards = {};
  const sorted = [...valid].sort((a, b) => b.summary.avgScore - a.summary.avgScore);

  const rankAwards = ['grand', 'excellence', 'outstanding'];
  sorted.slice(0, 3).forEach((entry, i) => {
    if (rankAwards[i]) {
      awards[rankAwards[i]] = {
        submissionId: entry.submissionId,
        name: entry.name,
        score: entry.summary.avgScore,
      };
    }
  });

  const topRankIds = new Set(Object.values(awards).map(a => a.submissionId));

  const specialAwards = [
    { id: 'planning', judgeId: 'kim-gihoek' },
    { id: 'creative', judgeId: 'jung-changui' },
    { id: 'design', judgeId: 'lee-dija' },
    { id: 'practical', judgeId: 'choi-silyong' },
  ];

  for (const award of specialAwards) {
    const candidates = allResults
      .filter(e => !topRankIds.has(e.submissionId))
      .filter(e => e.results[award.judgeId] && !e.results[award.judgeId].error)
      .sort((a, b) => (b.results[award.judgeId]?.score || 0) - (a.results[award.judgeId]?.score || 0));

    if (candidates[0]) {
      const winner = candidates[0];
      awards[award.id] = {
        submissionId: winner.submissionId,
        name: winner.name,
        score: winner.results[award.judgeId]?.score || 0,
      };
      topRankIds.add(winner.submissionId);
    }
  }

  return awards;
}
