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
  localStorage.setItem(JOINED_SESSIONS_KEY, JSON.stringify(nextSessions));
}

/**
 * Returns the current participant's unique ID, generating one if it doesn't exist.
 * @returns {string} UUID stored in localStorage
 */
export function getParticipantId() {
  let id = localStorage.getItem(PARTICIPANT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PARTICIPANT_ID_KEY, id);
  }
  return id;
}

/**
 * Returns the participant's saved nickname, or an empty string if unset.
 * @returns {string} Nickname from localStorage
 */
export function getNickname() {
  return localStorage.getItem(NICKNAME_KEY) || '';
}

/**
 * Persists the participant's nickname to localStorage.
 * @param {string} name - The nickname to save
 */
export function setNickname(name) {
  localStorage.setItem(NICKNAME_KEY, name);
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
 * Removes the joined marker for a session.
 * @param {string} sessionId
 */
export function clearJoinedSession(sessionId) {
  if (!sessionId) return;
  const joinedSessions = readJoinedSessions();
  delete joinedSessions[sessionId];
  writeJoinedSessions(joinedSessions);
}
