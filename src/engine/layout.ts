import type { QuantifierNode, RegexNode } from "./ast";
import { en, type Phrases } from "./phrases";
import { codeUnits } from "./text";

export type Point = { x: number; y: number };

export type StationKind = "literal" | "class" | "set" | "dot" | "anchor" | "backref";

export type Station = {
  id: number;
  kind: StationKind;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lane: number;
};

export type TrackKind = "main" | "branch" | "skip" | "loop" | "lazy";

export type Track = { owner: number; d: string; kind: TrackKind; lane: number };

export type Frame = {
  id: number;
  kind: "group" | "look";
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  lane: number;
};

export type Note = { owner: number; text: string; x: number; y: number; lane: number };

export type Diagram = {
  width: number;
  height: number;
  stations: Station[];
  tracks: Track[];
  frames: Frame[];
  notes: Note[];
  start: Point;
  end: Point;
  points: Map<number, Point>;
};

export const STATION_HEIGHT = 34;
export const CHAR_WIDTH = 7.8;
const STATION_PADDING = 14;
const GAP = 22;
const BRANCH = 30;
const RADIUS = 10;
const OPTION_GAP = 14;
const FRAME_PADDING = 12;
const FRAME_LABEL = 52;
const SKIP_SPACE = 24;
const LOOP_SPACE = 36;
const MARGIN = 28;
const TRAIN_SPACE = 30;
const TERMINAL = 34;

type Output = Pick<Diagram, "stations" | "tracks" | "frames" | "notes" | "points">;

type Block = {
  width: number;
  height: number;
  entry: number;
  draw: (x: number, y: number, out: Output) => void;
};

const visible: Record<string, string> = { " ": "␣", "\n": "↵", "\t": "⇥", "\r": "␍" };

export const stationLabel = (
  node: RegexNode,
  source: string,
  phrases: Phrases = en,
): [StationKind, string] => {
  switch (node.type) {
    case "literal":
      return [
        "literal",
        codeUnits(node.value)
          .map((char) => visible[char] ?? char)
          .join(""),
      ];
    case "dot":
      return ["dot", phrases.station.anyChar];
    case "class":
      return ["class", phrases.station.classes[node.class][node.negated ? 1 : 0]];
    case "set":
      return ["set", source.slice(node.span.start, node.span.end)];
    case "anchor":
      return ["anchor", phrases.station.anchors[node.kind]];
    case "backref":
      return ["backref", phrases.station.sameAs(node.name ? `“${node.name}”` : `#${node.group}`)];
    default:
      return ["literal", ""];
  }
};

export const stationWidth = (label: string) =>
  Math.max(STATION_HEIGHT, Math.round(label.length * CHAR_WIDTH + STATION_PADDING * 2));

const line = (from: Point, to: Point) => `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

const bend = (from: Point, to: Point) => {
  if (from.y === to.y) return line(from, to);
  const mid = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${mid} ${from.y}, ${mid} ${to.y}, ${to.x} ${to.y}`;
};

export function layoutRegex(root: RegexNode, source: string, phrases: Phrases = en): Diagram {
  const atom = (node: RegexNode, lane: number): Block => {
    const [kind, label] = stationLabel(node, source, phrases);
    const width = stationWidth(label);
    return {
      width,
      height: STATION_HEIGHT,
      entry: STATION_HEIGHT / 2,
      draw: (x, y, out) => {
        out.stations.push({ id: node.id, kind, label, x, y, width, height: STATION_HEIGHT, lane });
        out.points.set(node.id, { x: x + width / 2, y: y + STATION_HEIGHT / 2 });
      },
    };
  };

  const sequence = (owner: number, items: readonly RegexNode[], lane: number): Block => {
    if (!items.length) {
      return {
        width: GAP * 2,
        height: STATION_HEIGHT,
        entry: STATION_HEIGHT / 2,
        draw: (x, y, out) => {
          const at = y + STATION_HEIGHT / 2;
          out.tracks.push({
            owner,
            d: line({ x, y: at }, { x: x + GAP * 2, y: at }),
            kind: "main",
            lane,
          });
        },
      };
    }
    const blocks = items.map((item) => block(item, lane));
    const above = Math.max(...blocks.map((item) => item.entry));
    const below = Math.max(...blocks.map((item) => item.height - item.entry));
    const width = blocks.reduce((sum, item) => sum + item.width, 0) + GAP * (blocks.length - 1);
    return {
      width,
      height: above + below,
      entry: above,
      draw: (x, y, out) => {
        let cursor = x;
        blocks.forEach((item, index) => {
          if (index > 0) {
            out.tracks.push({
              owner,
              d: line({ x: cursor - GAP, y: y + above }, { x: cursor, y: y + above }),
              kind: "main",
              lane,
            });
          }
          item.draw(cursor, y + above - item.entry, out);
          cursor += item.width + GAP;
        });
      },
    };
  };

  const alternation = (owner: number, options: readonly RegexNode[], lane: number): Block => {
    const blocks = options.map((option) => block(option, lane));
    const inner = Math.max(...blocks.map((item) => item.width));
    const tops: number[] = [];
    let cursor = 0;
    for (const item of blocks) {
      tops.push(cursor);
      cursor += item.height + OPTION_GAP;
    }
    const last = blocks.at(-1);
    const height = (tops.at(-1) ?? 0) + (last?.height ?? 0);
    const entry = blocks[0]?.entry ?? 0;
    const width = inner + BRANCH * 2;
    return {
      width,
      height,
      entry,
      draw: (x, y, out) => {
        const enter = { x, y: y + entry };
        const leave = { x: x + width, y: y + entry };
        out.points.set(owner, enter);
        blocks.forEach((item, index) => {
          const top = y + (tops[index] ?? 0);
          const at = top + item.entry;
          const start = { x: x + BRANCH, y: at };
          const end = { x: x + BRANCH + item.width, y: at };
          out.tracks.push({ owner, d: bend(enter, start), kind: "branch", lane });
          if (item.width < inner) {
            out.tracks.push({
              owner,
              d: line(end, { x: x + BRANCH + inner, y: at }),
              kind: "branch",
              lane,
            });
          }
          out.tracks.push({
            owner,
            d: bend({ x: x + BRANCH + inner, y: at }, leave),
            kind: "branch",
            lane,
          });
          item.draw(x + BRANCH, top, out);
        });
      },
    };
  };

  const quantifier = (node: QuantifierNode, lane: number): Block => {
    const body = block(node.body, lane);
    const top = node.min === 0 ? SKIP_SPACE : 0;
    const bottom = node.max > 1 ? LOOP_SPACE : 0;
    const width = body.width + BRANCH * 2;
    const entry = top + body.entry;
    return {
      width,
      height: top + body.height + bottom,
      entry,
      draw: (x, y, out) => {
        const at = y + entry;
        const r = RADIUS;
        out.points.set(node.id, { x: x + BRANCH / 2, y: at });
        out.tracks.push({
          owner: node.id,
          d: line({ x, y: at }, { x: x + BRANCH, y: at }),
          kind: "main",
          lane,
        });
        out.tracks.push({
          owner: node.id,
          d: line({ x: x + BRANCH + body.width, y: at }, { x: x + width, y: at }),
          kind: "main",
          lane,
        });
        if (node.min === 0) {
          const sy = y + 6;
          out.tracks.push({
            owner: node.id,
            kind: "skip",
            lane,
            d: [
              `M ${x} ${at}`,
              `A ${r} ${r} 0 0 0 ${x + r} ${at - r}`,
              `L ${x + r} ${sy + r}`,
              `A ${r} ${r} 0 0 1 ${x + 2 * r} ${sy}`,
              `L ${x + width - 2 * r} ${sy}`,
              `A ${r} ${r} 0 0 1 ${x + width - r} ${sy + r}`,
              `L ${x + width - r} ${at - r}`,
              `A ${r} ${r} 0 0 0 ${x + width} ${at}`,
            ].join(" "),
          });
        }
        if (node.max > 1) {
          const right = x + BRANCH + body.width;
          const left = x + BRANCH;
          const ly = y + top + body.height + 12;
          out.tracks.push({
            owner: node.id,
            kind: node.lazy ? "lazy" : "loop",
            lane,
            d: [
              `M ${right} ${at}`,
              `A ${r} ${r} 0 0 1 ${right + r} ${at + r}`,
              `L ${right + r} ${ly - r}`,
              `A ${r} ${r} 0 0 1 ${right} ${ly}`,
              `L ${left} ${ly}`,
              `A ${r} ${r} 0 0 1 ${left - r} ${ly - r}`,
              `L ${left - r} ${at + r}`,
              `A ${r} ${r} 0 0 1 ${left} ${at}`,
            ].join(" "),
          });
          out.notes.push({
            owner: node.id,
            text: phrases.note(node),
            x: x + width / 2,
            y: ly + 16,
            lane,
          });
        }
        body.draw(x + BRANCH, y + top, out);
      },
    };
  };

  const framed = (
    node: RegexNode,
    body: RegexNode,
    kind: Frame["kind"],
    label: string,
    innerLane: number,
  ): Block => {
    const inner = block(body, innerLane);
    const labelWidth = label.length * 6.6 + FRAME_PADDING * 2;
    const width = Math.max(inner.width + FRAME_PADDING * 2, labelWidth);
    const offset = (width - inner.width) / 2;
    const entry = FRAME_LABEL + inner.entry;
    return {
      width,
      height: FRAME_LABEL + inner.height + FRAME_PADDING,
      entry,
      draw: (x, y, out) => {
        const at = y + entry;
        out.frames.push({
          id: node.id,
          kind,
          label,
          x,
          y,
          width,
          height: FRAME_LABEL + inner.height + FRAME_PADDING,
          lane: innerLane,
        });
        out.points.set(node.id, { x, y: at });
        out.tracks.push({
          owner: node.id,
          d: line({ x, y: at }, { x: x + offset, y: at }),
          kind: "main",
          lane: innerLane,
        });
        out.tracks.push({
          owner: node.id,
          d: line({ x: x + offset + inner.width, y: at }, { x: x + width, y: at }),
          kind: "main",
          lane: innerLane,
        });
        inner.draw(x + offset, y + FRAME_LABEL, out);
      },
    };
  };

  function block(node: RegexNode, lane: number): Block {
    switch (node.type) {
      case "sequence":
        return sequence(node.id, node.items, lane);
      case "alternation":
        return alternation(node.id, node.options, lane);
      case "quantifier":
        return quantifier(node, lane);
      case "group": {
        const label =
          node.index === null
            ? phrases.frame.group
            : `#${node.index}${node.name ? ` ${node.name}` : ""}`;
        return framed(node, node.body, "group", label, node.index ?? lane);
      }
      case "look": {
        const label = phrases.frame.look(node.negated, node.behind);
        return framed(node, node.body, "look", label, lane);
      }
      default:
        return atom(node, lane);
    }
  }

  const main = block(root, 0);
  const out: Output = { stations: [], tracks: [], frames: [], notes: [], points: new Map() };
  const x = MARGIN + TERMINAL;
  const y = MARGIN + TRAIN_SPACE;
  const at = y + main.entry;
  main.draw(x, y, out);
  const start = { x: MARGIN + 6, y: at };
  const end = { x: x + main.width + TERMINAL - 6, y: at };
  out.tracks.unshift(
    { owner: -1, d: line(start, { x, y: at }), kind: "main", lane: 0 },
    { owner: -1, d: line({ x: x + main.width, y: at }, end), kind: "main", lane: 0 },
  );
  return {
    ...out,
    width: x + main.width + TERMINAL + MARGIN,
    height: main.height + MARGIN * 2 + TRAIN_SPACE + 8,
    start,
    end,
  };
}
