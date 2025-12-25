/**
 * Haptic Feedback Utility
 * Fornece feedback tátil em dispositivos compatíveis
 */

export type HapticPattern =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"
  | "selection"
  | number
  | number[];

const patterns: Record<string, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 50,
  success: [50, 30, 50],
  warning: [30, 50, 30, 50],
  error: [100, 50, 100],
  selection: 15,
};

export const vibrate = (pattern: HapticPattern = "medium"): void => {
  if (!("vibrate" in navigator)) return;
  if (location.protocol !== "https:" && location.hostname !== "localhost")
    return;

  try {
    const vibrationPattern =
      typeof pattern === "string" ? patterns[pattern] : pattern;

    if (vibrationPattern) {
      navigator.vibrate(vibrationPattern);
    }
  } catch (error) {
    console.error("Haptic feedback error:", error);
  }
};

export const stopVibration = (): void => {
  if ("vibrate" in navigator) {
    navigator.vibrate(0);
  }
};

export const isHapticAvailable = (): boolean => {
  return "vibrate" in navigator;
};
