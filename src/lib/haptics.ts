/**
 * Mobile Web Haptics Engine
 * Provides sensory tactile feedback on iOS Safari (PWA) and Android Chrome via navigator.vibrate
 */

export function isHapticsSupported(): boolean {
  return typeof window !== "undefined" && "vibrate" in navigator;
}

export function hapticLight() {
  if (isHapticsSupported()) {
    try {
      navigator.vibrate(10);
    } catch (_) {}
  }
}

export function hapticMedium() {
  if (isHapticsSupported()) {
    try {
      navigator.vibrate(25);
    } catch (_) {}
  }
}

export function hapticSuccess() {
  if (isHapticsSupported()) {
    try {
      // Short-pulse celebration
      navigator.vibrate([15, 45, 25]);
    } catch (_) {}
  }
}

export function hapticWarning() {
  if (isHapticsSupported()) {
    try {
      navigator.vibrate([35, 30, 35]);
    } catch (_) {}
  }
}

export function hapticMilestone() {
  if (isHapticsSupported()) {
    try {
      // Grand celebration pulse: 3-beat rhythm
      navigator.vibrate([25, 60, 35, 60, 50]);
    } catch (_) {}
  }
}
