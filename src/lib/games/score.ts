// Scoring for Shadow Speak: which words of the phrase the student actually said, in order.

export function words(text: string): string[] {
  return (text.toLowerCase().replace(/[’']/g, "'").match(/[a-z0-9']+/g) ?? []).map((w) => w.replace(/^'+|'+$/g, ""));
}

/** For each word of the target, whether it was said (longest common subsequence). */
export function matchWords(target: string, said: string): boolean[] {
  const a = words(target);
  const b = words(said);
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hit = new Array<boolean>(a.length).fill(false);
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { hit[i] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return hit;
}

/** Points for one phrase: 10 per word said, x2 for a perfect phrase. */
export function phraseScore(hit: boolean[]): { points: number; accuracy: number; perfect: boolean } {
  const n = hit.filter(Boolean).length;
  const accuracy = hit.length ? n / hit.length : 0;
  const perfect = hit.length > 0 && n === hit.length;
  return { points: n * 10 * (perfect ? 2 : 1), accuracy, perfect };
}
