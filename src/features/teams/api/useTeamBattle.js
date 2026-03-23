import { ref, onValue, update, remove } from 'firebase/database';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';

const TEAM_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
const TEAM_COLORS = [
  { bg: 'bg-slate-900', text: 'text-white', light: 'bg-slate-100', lightText: 'text-slate-700', bar: 'bg-slate-800' },
  { bg: 'bg-slate-600', text: 'text-white', light: 'bg-slate-50', lightText: 'text-slate-600', bar: 'bg-slate-500' },
  { bg: 'bg-slate-400', text: 'text-white', light: 'bg-slate-50', lightText: 'text-slate-500', bar: 'bg-slate-400' },
  { bg: 'bg-slate-300', text: 'text-slate-800', light: 'bg-slate-50', lightText: 'text-slate-400', bar: 'bg-slate-300' },
];

/**
 * Hook for team battle management (instructor side).
 * Reads teamBattle node, provides start/stop/team data.
 */
export function useTeamBattle(sessionId) {
  const [teamBattle, setTeamBattle] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    const tbRef = ref(db, `sessions/${sessionId}/teamBattle`);
    const unsub = onValue(tbRef, (snap) => {
      setTeamBattle(snap.val() || null);
    });
    return () => unsub();
  }, [sessionId]);

  const isActive = Boolean(teamBattle?.active);
  const teamCount = teamBattle?.teamCount || 0;
  const teams = teamBattle?.teams || {};

  const startTeamBattle = useCallback(async (participantIds, count = 2) => {
    if (!sessionId || !participantIds.length) return;
    const clamped = Math.max(2, Math.min(4, count));

    // Shuffle participants deterministically
    const shuffled = [...participantIds].sort(() => Math.random() - 0.5);

    const teamsData = {};
    for (let i = 0; i < clamped; i++) {
      teamsData[`team${i}`] = {
        name: TEAM_NAMES[i],
        members: [],
      };
    }

    // Round-robin assignment
    shuffled.forEach((pid, idx) => {
      const teamKey = `team${idx % clamped}`;
      teamsData[teamKey].members.push(pid);
    });

    // Convert arrays to objects for Firebase
    const firebaseTeams = {};
    for (const [key, team] of Object.entries(teamsData)) {
      firebaseTeams[key] = {
        name: team.name,
        members: Object.fromEntries(team.members.map((pid) => [pid, true])),
      };
    }

    await update(ref(db, `sessions/${sessionId}/teamBattle`), {
      active: true,
      teamCount: clamped,
      teams: firebaseTeams,
      startedAt: Date.now(),
    });
  }, [sessionId]);

  const endTeamBattle = useCallback(async () => {
    if (!sessionId) return;
    await remove(ref(db, `sessions/${sessionId}/teamBattle`));
  }, [sessionId]);

  return { teamBattle, isActive, teamCount, teams, startTeamBattle, endTeamBattle };
}

/**
 * Compute team scores from individual participant scores.
 * Returns array sorted by total score descending.
 */
export function useTeamScores(teams, scores) {
  return useMemo(() => {
    if (!teams || Object.keys(teams).length === 0) return [];

    return Object.entries(teams)
      .map(([key, team], idx) => {
        const members = team.members ? Object.keys(team.members) : [];
        let totalScore = 0;
        let memberCount = members.length;

        members.forEach((pid) => {
          const s = scores[pid];
          if (s) {
            totalScore += s.total || 0;
          }
        });

        return {
          key,
          name: team.name || TEAM_NAMES[idx] || `Team ${idx + 1}`,
          colors: TEAM_COLORS[idx] || TEAM_COLORS[0],
          members,
          memberCount,
          totalScore,
          avgScore: memberCount > 0 ? Math.round(totalScore / memberCount) : 0,
        };
      })
      .sort((a, b) => b.totalScore - a.totalScore);
  }, [teams, scores]);
}

/**
 * Hook for student side — find my team from teamBattle data.
 */
export function useMyTeam(sessionId, participantId) {
  const [teamBattle, setTeamBattle] = useState(null);

  useEffect(() => {
    if (!sessionId) return;
    const tbRef = ref(db, `sessions/${sessionId}/teamBattle`);
    const unsub = onValue(tbRef, (snap) => {
      setTeamBattle(snap.val() || null);
    });
    return () => unsub();
  }, [sessionId]);

  return useMemo(() => {
    if (!teamBattle?.active || !teamBattle?.teams || !participantId) {
      return { isActive: false, myTeam: null, myTeamIndex: -1 };
    }

    const entries = Object.entries(teamBattle.teams);
    for (let i = 0; i < entries.length; i++) {
      const [, team] = entries[i];
      if (team.members && team.members[participantId]) {
        return {
          isActive: true,
          myTeam: {
            name: team.name || TEAM_NAMES[i],
            colors: TEAM_COLORS[i] || TEAM_COLORS[0],
            memberCount: Object.keys(team.members).length,
          },
          myTeamIndex: i,
        };
      }
    }

    return { isActive: true, myTeam: null, myTeamIndex: -1 };
  }, [teamBattle, participantId]);
}

export { TEAM_NAMES, TEAM_COLORS };
