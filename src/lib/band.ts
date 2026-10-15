// IELTS score maths. Raw-to-band tables follow the conversion widely published by
// test centres; individual tests may shift a boundary by one answer.

type Row = [minCorrect: number, band: number];

const LISTENING: Row[] = [
  [39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5],
  [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1],
];

const READING_ACADEMIC: Row[] = [
  [39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5],
  [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [2, 2], [1, 1],
];

const READING_GENERAL: Row[] = [
  [40, 9], [39, 8.5], [37, 8], [36, 7.5], [34, 7], [32, 6.5], [30, 6], [27, 5.5],
  [23, 5], [19, 4.5], [15, 4], [12, 3.5], [9, 3], [6, 2.5], [3, 2], [1, 1],
];

export type Section = "listening" | "reading" | "writing" | "speaking";
export type Format = "academic" | "general";

function lookup(table: Row[], correct: number): number {
  for (const [min, band] of table) if (correct >= min) return band;
  return 0;
}

/** Band for a full 40-question Listening or Reading paper. */
export function bandFromRaw(section: "listening" | "reading", correct: number, format: Format = "academic"): number {
  const c = Math.max(0, Math.min(40, Math.round(correct)));
  if (section === "listening") return lookup(LISTENING, c);
  return lookup(format === "general" ? READING_GENERAL : READING_ACADEMIC, c);
}

/** Band for a shorter practice set, scaled to the 40-question paper. */
export function bandFromPractice(section: "listening" | "reading", correct: number, total: number, format: Format = "academic"): number {
  if (total <= 0) return 0;
  return bandFromRaw(section, (correct / total) * 40, format);
}

/** Rounds to the nearest half band: x.25 goes up to x.5, x.75 goes up to the next whole band. */
export function roundBand(value: number): number {
  return Math.round(value * 2) / 2;
}

/** Overall band: the mean of the four sections, rounded the IELTS way. */
export function overallBand(scores: [number, number, number, number]): number {
  return roundBand(scores.reduce((a, b) => a + b, 0) / 4);
}

/** How many correct answers out of 40 are needed for a band. */
export function correctNeeded(section: "listening" | "reading", band: number, format: Format = "academic"): number | null {
  const table = section === "listening" ? LISTENING : format === "general" ? READING_GENERAL : READING_ACADEMIC;
  const rows = table.filter(([, b]) => b >= band);
  return rows.length ? rows[rows.length - 1][0] : null;
}

export function formatBand(band: number): string {
  return band.toFixed(1);
}
