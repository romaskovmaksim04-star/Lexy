// Types for the parts of the vendored openlura face that LexiUp uses.
export class Face {
  constructor(host: HTMLElement, options?: { small?: boolean; particles?: boolean; viewBox?: string; idle?: boolean });
  setEmotion(name: string, options?: { intensity?: number; kick?: boolean }): void;
  react(name: string, ms?: number, intensity?: number): void;
  gesture(name: string): void;
  speak(text?: string, options?: { durationMs?: number }): void;
  silence(): void;
  listen(on: boolean): void;
  think(on: boolean): void;
  poke(): void;
  destroy(): void;
}
export function setReduced(on: boolean): void;
export const EMOTIONS: Record<string, { label: string }>;
