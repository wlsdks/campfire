const PARTICIPANT_ID_KEY = 'pinggo_participant_id';
const NICKNAME_KEY = 'pinggo_nickname';
const JOINED_SESSIONS_KEY = 'pinggo_joined_sessions';

function readJoinedSessions() {
  try {
    return JSON.parse(localStorage.getItem(JOINED_SESSIONS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeJoinedSessions(nextSessions) {
  try { localStorage.setItem(JOINED_SESSIONS_KEY, JSON.stringify(nextSessions)); } catch { /* quota/private */ }
}

/**
 * Returns the current participant's unique ID, generating one if it doesn't exist.
 * @returns {string} UUID stored in localStorage
 */
export function getParticipantId() {
  let id;
  try { id = localStorage.getItem(PARTICIPANT_ID_KEY); } catch { /* private browsing */ }
  if (!id) {
    // Inline UUID v4 with fallback for older browsers (Safari <15.3)
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      id = crypto.randomUUID();
    } else {
      const bytes = new Uint8Array(16);
      crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const h = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
      id = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    }
    try { localStorage.setItem(PARTICIPANT_ID_KEY, id); } catch { /* quota/private */ }
  }
  return id;
}

/**
 * Returns the participant's saved nickname, or an empty string if unset.
 * @returns {string} Nickname from localStorage
 */
export function getNickname() {
  try { return localStorage.getItem(NICKNAME_KEY) || ''; } catch { return ''; }
}

/**
 * Persists the participant's nickname to localStorage.
 * @param {string} name - The nickname to save
 */
export function setNickname(name) {
  try { localStorage.setItem(NICKNAME_KEY, name); } catch { /* quota/private */ }
}

/**
 * Returns whether the current participant has already joined a specific session.
 * @param {string} sessionId
 * @returns {boolean}
 */
export function hasJoinedSession(sessionId) {
  if (!sessionId) return false;
  const joinedSessions = readJoinedSessions();
  return joinedSessions[sessionId]?.participantId === getParticipantId();
}

/**
 * Marks a session as joined for the current participant.
 * @param {string} sessionId
 * @param {string} participantId
 */
export function markSessionJoined(sessionId, participantId) {
  if (!sessionId || !participantId) return;
  const joinedSessions = readJoinedSessions();
  writeJoinedSessions({
    ...joinedSessions,
    [sessionId]: {
      participantId,
      joinedAt: Date.now(),
    },
  });
}

/**
 * Returns the last-seen count for a channel (chat/qa/dm) in a session.
 * Used to suppress false unread badges on page refresh.
 * @param {string} sessionId
 * @param {string} channel - 'chat' | 'qa' | 'dm'
 * @returns {number} last-seen count, or -1 if never opened
 */
export function getLastSeen(sessionId, channel) {
  try {
    const v = localStorage.getItem(`pick_${channel}_seen_${sessionId}`);
    return v !== null ? parseInt(v, 10) : -1;
  } catch {
    return -1;
  }
}

/**
 * Saves the last-seen count for a channel in a session.
 * @param {string} sessionId
 * @param {string} channel - 'chat' | 'qa' | 'dm'
 * @param {number} count
 */
export function saveLastSeen(sessionId, channel, count) {
  try {
    localStorage.setItem(`pick_${channel}_seen_${sessionId}`, String(count));
  } catch { /* silent */ }
}
