import {
  childrenOf,
  type ClassKind,
  type Flags,
  type ParsedRegex,
  type RegexNode,
  type SetItem,
} from "./ast";
import { codeUnits } from "./text";

export type Capture = { start: number; end: number } | null;

export type TraceEvent =
  | { type: "attempt"; start: number }
  | { type: "step"; node: number; pos: number; end: number; ok: boolean }
  | { type: "backtrack"; node: number; pos: number }
  | { type: "match"; start: number; end: number };

export type Match = {
  start: number;
  end: number;
  value: string;
  captures: readonly Capture[];
};

export type RunStatus = "complete" | "budget" | "depth";

export type RunResult = {
  matches: readonly Match[];
  steps: number;
  trace: readonly TraceEvent[];
  traceTruncated: boolean;
  status: RunStatus;
};

export type RunOptions = { budget?: number; traceLimit?: number; maxMatches?: number };

type Captures = readonly Capture[];
type Continuation = (pos: number, captures: Captures) => boolean;

class BudgetExceeded extends Error {}

const LINE_TERMINATORS = new Set(["\n", "\r", "\u2028", "\u2029"]);
const SPACE = /[\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/;
const WORD = /[A-Za-z0-9_]/;
const DIGIT = /[0-9]/;

const classTests: Record<ClassKind, RegExp> = { digit: DIGIT, word: WORD, space: SPACE };

export const testClass = (kind: ClassKind, char: string) => classTests[kind].test(char);

const canonical = (char: string) => {
  const upper = char.toUpperCase();
  if (upper.length !== 1) return char;
  if (char.charCodeAt(0) >= 128 && upper.charCodeAt(0) < 128) return char;
  return upper;
};

const variants = (char: string, ignoreCase: boolean) =>
  ignoreCase ? [char, char.toLowerCase(), char.toUpperCase()] : [char];

const charEquals = (a: string, b: string, ignoreCase: boolean) =>
  a === b || (ignoreCase && canonical(a) === canonical(b));

const setItemMatches = (item: SetItem, char: string, ignoreCase: boolean) => {
  switch (item.kind) {
    case "char":
      return charEquals(item.char, char, ignoreCase);
    case "range":
      return variants(char, ignoreCase).some((value) => value >= item.from && value <= item.to);
    case "class":
      return testClass(item.class, char) !== item.negated;
  }
};

const isWordAt = (text: string, index: number) =>
  index >= 0 && index < text.length && WORD.test(text[index] ?? "");

const captureIndexes = (node: RegexNode): number[] => [
  ...(node.type === "group" && node.index !== null ? [node.index] : []),
  ...childrenOf(node).flatMap(captureIndexes),
];

export function runRegex(
  parsed: ParsedRegex,
  flags: Flags,
  text: string,
  options: RunOptions = {},
): RunResult {
  const budget = options.budget ?? 250_000;
  const traceLimit = options.traceLimit ?? 4_000;
  const maxMatches = options.maxMatches ?? 1_000;
  const trace: TraceEvent[] = [];
  const nestedCaptures = new Map<number, number[]>();
  let steps = 0;
  let traceTruncated = false;

  const record = (event: TraceEvent) => {
    if (trace.length < traceLimit) trace.push(event);
    else traceTruncated = true;
  };

  const tick = () => {
    steps += 1;
    if (steps > budget) throw new BudgetExceeded();
  };

  const step = (node: number, pos: number, end: number, ok: boolean) => {
    tick();
    record({ type: "step", node, pos, end, ok });
    return ok;
  };

  const withCapture = (captures: Captures, index: number, value: Capture) => {
    const next = captures.slice();
    next[index] = value;
    return next;
  };

  const clearCaptures = (captures: Captures, indexes: readonly number[]) => {
    if (!indexes.some((index) => captures[index] !== null)) return captures;
    const next = captures.slice();
    for (const index of indexes) next[index] = null;
    return next;
  };

  const anchorHolds = (kind: string, pos: number) => {
    switch (kind) {
      case "start":
        return pos === 0 || (flags.multiline && LINE_TERMINATORS.has(text[pos - 1] ?? ""));
      case "end":
        return pos === text.length || (flags.multiline && LINE_TERMINATORS.has(text[pos] ?? ""));
      case "wordBoundary":
        return isWordAt(text, pos - 1) !== isWordAt(text, pos);
      default:
        return isWordAt(text, pos - 1) === isWordAt(text, pos);
    }
  };

  const singleChar = (node: RegexNode, char: string): boolean => {
    switch (node.type) {
      case "dot":
        return flags.dotAll || !LINE_TERMINATORS.has(char);
      case "class":
        return testClass(node.class, char) !== node.negated;
      case "set":
        return (
          node.items.some((item) => setItemMatches(item, char, flags.ignoreCase)) !== node.negated
        );
      default:
        return false;
    }
  };

  const lookBehind = (
    body: RegexNode,
    pos: number,
    captures: Captures,
    inner: { captures: Captures | null },
  ) => {
    for (let start = pos; start >= 0; start -= 1) {
      const found = match(body, start, captures, (end, after) => {
        if (end !== pos) return false;
        inner.captures = after;
        return true;
      });
      if (found) return true;
    }
    return false;
  };

  function match(node: RegexNode, pos: number, captures: Captures, next: Continuation): boolean {
    switch (node.type) {
      case "literal": {
        const slice = text.slice(pos, pos + node.value.length);
        let ok = slice.length === node.value.length;
        for (let index = 0; ok && index < node.value.length; index += 1) {
          ok = charEquals(node.value[index] ?? "", slice[index] ?? "", flags.ignoreCase);
        }
        return (
          step(node.id, pos, pos + node.value.length, ok) && next(pos + node.value.length, captures)
        );
      }
      case "dot":
      case "class":
      case "set": {
        const char = text[pos];
        return (
          step(node.id, pos, pos + 1, char !== undefined && singleChar(node, char)) &&
          next(pos + 1, captures)
        );
      }
      case "anchor":
        return step(node.id, pos, pos, anchorHolds(node.kind, pos)) && next(pos, captures);
      case "backref": {
        const capture = captures[node.group] ?? null;
        if (!capture) return step(node.id, pos, pos, true) && next(pos, captures);
        const expected = text.slice(capture.start, capture.end);
        const actual = text.slice(pos, pos + expected.length);
        const ok =
          actual.length === expected.length &&
          codeUnits(expected).every((char, index) =>
            charEquals(char, actual.charAt(index), flags.ignoreCase),
          );
        return (
          step(node.id, pos, pos + expected.length, ok) && next(pos + expected.length, captures)
        );
      }
      case "sequence": {
        const chain = (index: number, at: number, current: Captures): boolean => {
          const item = node.items[index];
          return item
            ? match(item, at, current, (end, after) => chain(index + 1, end, after))
            : next(at, current);
        };
        return chain(0, pos, captures);
      }
      case "alternation":
        return node.options.some((option, index) => {
          if (index > 0) {
            tick();
            record({ type: "backtrack", node: node.id, pos });
          }
          return match(option, pos, captures, next);
        });
      case "group":
        if (node.index === null) return match(node.body, pos, captures, next);
        return match(node.body, pos, captures, (end, after) =>
          next(end, withCapture(after, node.index ?? 0, { start: pos, end })),
        );
      case "look": {
        const inner: { captures: Captures | null } = { captures: null };
        const found = node.behind
          ? lookBehind(node.body, pos, captures, inner)
          : match(node.body, pos, captures, (_, after) => {
              inner.captures = after;
              return true;
            });
        if (node.negated) return !found && next(pos, captures);
        return found && next(pos, inner.captures ?? captures);
      }
      case "quantifier": {
        let indexes = nestedCaptures.get(node.id);
        if (!indexes) {
          indexes = captureIndexes(node.body);
          nestedCaptures.set(node.id, indexes);
        }
        const inner = indexes;
        const repeat = (count: number, at: number, current: Captures): boolean => {
          const more = () =>
            count < node.max &&
            match(node.body, at, clearCaptures(current, inner), (end, after) =>
              end === at && count >= node.min ? false : repeat(count + 1, end, after),
            );
          const stop = () => count >= node.min && next(at, current);
          const [first, second] = node.lazy ? [stop, more] : [more, stop];
          if (first()) return true;
          tick();
          record({ type: "backtrack", node: node.id, pos: at });
          return second();
        };
        return repeat(0, pos, captures);
      }
    }
  }

  const matches: Match[] = [];
  const empty: Captures = Array.from({ length: parsed.groupCount + 1 }, () => null);
  let status: RunStatus = "complete";

  try {
    let start = 0;
    while (start <= text.length && matches.length < maxMatches) {
      tick();
      record({ type: "attempt", start });
      const found: { end: number; captures: Captures } = { end: -1, captures: empty };
      const ok = match(parsed.root, start, empty, (end, captures) => {
        found.end = end;
        found.captures = captures;
        return true;
      });
      if (ok) {
        tick();
        record({ type: "match", start, end: found.end });
        matches.push({
          start,
          end: found.end,
          value: text.slice(start, found.end),
          captures: found.captures.slice(1),
        });
        if (!flags.global) break;
        start = found.end === start ? start + 1 : found.end;
      } else {
        start += 1;
      }
    }
  } catch (error) {
    if (error instanceof BudgetExceeded) status = "budget";
    else if (error instanceof RangeError) status = "depth";
    else throw error;
  }

  return { matches, steps, trace, traceTruncated, status };
}
