// SM-2 style spaced repetition for the vocabulary trainer.

export type Grade = 0 | 1 | 2 | 3; // again | hard | good | easy
export type CardState = { ease: number; interval: number; reps: number };

const DAY = 24 * 60 * 60 * 1000;

export function review(state: CardState, grade: Grade, now = new Date()): CardState & { due: Date } {
  let { ease, interval, reps } = state;
  if (grade === 0) {
    reps = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
    // Show again in ten minutes within the same session
    return { ease, interval, reps, due: new Date(now.getTime() + 10 * 60 * 1000) };
  }
  reps += 1;
  if (reps === 1) interval = grade === 3 ? 3 : 1;
  else if (reps === 2) interval = grade === 1 ? 3 : 6;
  else interval = Math.round(interval * ease * (grade === 1 ? 0.8 : grade === 3 ? 1.3 : 1));
  ease = Math.max(1.3, ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0));
  return { ease, interval, reps, due: new Date(now.getTime() + interval * DAY) };
}
