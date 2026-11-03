import type { Analysis } from "../../engine/analyze";
import type { Point } from "../../engine/layout";
import type { TraceEvent } from "../../engine/matcher";

export type Tone = "idle" | "ok" | "fail" | "back" | "match";

export type TrainState = {
  event: TraceEvent | null;
  point: Point;
  tone: Tone;
  node: number | null;
  pos: number;
  end: number;
  visited: ReadonlySet<number>;
};

type Ready = Extract<Analysis, { ok: true }>;

export const totalSteps = (analysis: Ready) => analysis.run.trace.length;

export function trainAt(analysis: Ready, step: number): TrainState {
  const { trace } = analysis.run;
  const { diagram } = analysis;
  const event = step > 0 ? (trace[Math.min(step, trace.length) - 1] ?? null) : null;
  const visited = new Set<number>();

  if (event) {
    for (let index = Math.min(step, trace.length) - 1; index >= 0; index -= 1) {
      const previous = trace[index];
      if (!previous || previous.type === "attempt") break;
      if (previous.type === "step" && previous.ok) visited.add(previous.node);
    }
  }

  if (!event)
    return { event, point: diagram.start, tone: "idle", node: null, pos: 0, end: 0, visited };

  switch (event.type) {
    case "attempt":
      return {
        event,
        point: diagram.start,
        tone: "idle",
        node: null,
        pos: event.start,
        end: event.start,
        visited,
      };
    case "match":
      return {
        event,
        point: diagram.end,
        tone: "match",
        node: null,
        pos: event.start,
        end: event.end,
        visited,
      };
    case "backtrack":
      return {
        event,
        point: diagram.points.get(event.node) ?? diagram.start,
        tone: "back",
        node: event.node,
        pos: event.pos,
        end: event.pos,
        visited,
      };
    case "step":
      return {
        event,
        point: diagram.points.get(event.node) ?? diagram.start,
        tone: event.ok ? "ok" : "fail",
        node: event.node,
        pos: event.pos,
        end: event.end,
        visited,
      };
  }
}
