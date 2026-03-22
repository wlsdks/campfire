/**
 * Haptic feedback utilities for mobile web.
 * Uses Vibration API (Android Chrome/Samsung Internet).
 * iOS Safari does NOT support — graceful no-op.
 */

/** Light tap — button press, selection */
export function hapticTap() {
  if ('vibrate' in navigator) navigator.vibrate(10);
}

/** Success — vote confirmed, correct answer */
export function hapticSuccess() {
  if ('vibrate' in navigator) navigator.vibrate([10, 30, 10]);
}

/** Error — wrong answer, validation fail */
export function hapticError() {
  if ('vibrate' in navigator) navigator.vibrate([30, 50, 30, 50, 30]);
}
