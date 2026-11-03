import type { Match } from "../../engine/matcher";

export type Segment = {
  start: number;
  end: number;
  match: number | null;
  cursor: "ok" | "fail" | "probe" | null;
};

export type Cursor = { pos: number; end: number; tone: "ok" | "fail" | "probe" } | null;

export function segment(length: number, matches: readonly Match[], cursor: Cursor): Segment[] {
  const cuts = new Set([0, length]);
  for (const match of matches) {
    cuts.add(match.start);
    cuts.add(match.end);
  }
  if (cursor) {
    cuts.add(Math.min(cursor.pos, length));
    cuts.add(Math.min(Math.max(cursor.end, cursor.pos + 1), length));
  }
  const points = [...cuts].filter((value) => value >= 0 && value <= length).sort((a, b) => a - b);
  const segments: Segment[] = [];
  points.slice(1).forEach((end, index) => {
    const start = points[index] ?? 0;
    if (end <= start) return;
    const match = matches.findIndex(
      (item) => item.start <= start && end <= item.end && item.end > item.start,
    );
    const inCursor =
      cursor !== null && start >= cursor.pos && end <= Math.max(cursor.end, cursor.pos + 1);
    segments.push({
      start,
      end,
      match: match === -1 ? null : match,
      cursor: inCursor ? cursor.tone : null,
    });
  });
  return segments;
}
