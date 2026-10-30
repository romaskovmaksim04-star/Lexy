"use client";

import { useEffect } from "react";

/**
 * Holds a Screen Wake Lock while the component is mounted so the phone does not
 * dim/lock mid-game or mid-call. Re-acquired on visibilitychange (the lock drops
 * when the tab is hidden). Fails silently where unsupported (iOS < 16.4, some
 * desktop browsers, non-secure contexts).
 */
export function WakeLock() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    const nav = navigator as Navigator & { wakeLock: { request: (t: string) => Promise<WakeLockSentinel> } };
    let lock: WakeLockSentinel | null = null;
    let released = false;

    const acquire = async () => {
      if (released || document.visibilityState !== "visible") return;
      try {
        lock = await nav.wakeLock.request("screen");
        lock.addEventListener("release", () => { lock = null; });
      } catch {
        /* battery saver / unsupported — ignore */
      }
    };
    const onVis = () => { if (document.visibilityState === "visible") acquire(); };

    acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
      lock = null;
    };
  }, []);

  return null;
}
