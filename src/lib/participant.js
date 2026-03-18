const PARTICIPANT_ID_KEY = 'pinggo_participant_id';
const NICKNAME_KEY = 'pinggo_nickname';

export function getParticipantId() {
  let id = localStorage.getItem(PARTICIPANT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PARTICIPANT_ID_KEY, id);
  }
  return id;
}

export function getNickname() {
  return localStorage.getItem(NICKNAME_KEY) || '';
}

export function setNickname(name) {
  localStorage.setItem(NICKNAME_KEY, name);
}
