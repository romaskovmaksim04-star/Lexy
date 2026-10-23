"use client";

import { useSyncExternalStore } from "react";

// Animations follow the site's own switch, not the system "reduce motion" flag: on
// Windows that flag is turned on by "Visual effects: off" in performance settings, which
// many people use for speed, not because motion bothers them. Whoever does want calm
// pages turns animations off in the footer or the profile; the choice is remembered.

export const MOTION_KEY = "lexy-motion";

function subscribe(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  return () => mo.disconnect();
}

export function isCalm(): boolean {
  return typeof document !== "undefined" && document.documentElement.dataset.motion === "off";
}

/** True when the visitor switched animations off on the site. */
export function useCalm(): boolean {
  return useSyncExternalStore(subscribe, isCalm, () => false);
}

export function setMotion(on: boolean) {
  document.documentElement.dataset.motion = on ? "on" : "off";
  try { localStorage.setItem(MOTION_KEY, on ? "on" : "off"); } catch { /* private mode */ }
}
