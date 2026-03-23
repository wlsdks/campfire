/**
 * Hash a password using SHA-256 via Web Crypto API.
 * @param {string} password
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a unique ID for admin users.
 * @returns {string} ID prefixed with "adm_"
 */
export function generateId() {
  // Fallback for browsers without crypto.randomUUID (Safari <15.3)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return 'adm_' + crypto.randomUUID().slice(0, 12);
  }
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return 'adm_' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}
