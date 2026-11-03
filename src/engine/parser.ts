import type {
  AnchorKind,
  ClassKind,
  LiteralNode,
  ParsedRegex,
  QuantifierNode,
  RegexNode,
  SetItem,
  Span,
} from "./ast";
import { en, type ErrorDetail } from "./phrases";

export class RegexSyntaxError extends Error {
  readonly detail: ErrorDetail;
  readonly position: number;
  readonly length: number;

  constructor(detail: ErrorDetail, position: number, length = 1) {
    super(en.error(detail));
    this.detail = detail;
    this.name = "RegexSyntaxError";
    this.position = position;
    this.length = length;
  }
}

const GROUP_NAME = /^[A-Za-z_$][\w$]*$/;

const classEscapes: Record<string, { class: ClassKind; negated: boolean }> = {
  d: { class: "digit", negated: false },
  D: { class: "digit", negated: true },
  w: { class: "word", negated: false },
  W: { class: "word", negated: true },
  s: { class: "space", negated: false },
  S: { class: "space", negated: true },
};

const controlEscapes: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  f: "\f",
  v: "\v",
  "0": "\0",
};

const scanGroups = (source: string) => {
  const names = new Map<string, number>();
  let count = 0;
  let inSet = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === "\\") {
      index += 1;
    } else if (inSet) {
      if (char === "]") inSet = false;
    } else if (char === "[") {
      inSet = true;
    } else if (char === "(") {
      if (source[index + 1] !== "?") {
        count += 1;
      } else if (source[index + 2] === "<" && !["=", "!"].includes(source[index + 3] ?? "")) {
        count += 1;
        const close = source.indexOf(">", index + 3);
        if (close !== -1) {
          const name = source.slice(index + 3, close);
          if (names.has(name))
            throw new RegexSyntaxError({ code: "duplicateName", name }, index, close - index + 1);
          names.set(name, count);
        }
      }
    }
  }
  return { count, names };
};

export function parseRegex(source: string): ParsedRegex {
  const { count: groupCount, names: groupNames } = scanGroups(source);
  const nodes = new Map<number, RegexNode>();
  let pos = 0;
  let nextId = 0;
  let nextGroup = 0;

  const add = <T extends RegexNode>(node: T): T => {
    nodes.set(node.id, node);
    return node;
  };

  const span = (start: number): Span => ({ start, end: pos });
  const peek = (offset = 0) => source[pos + offset];
  const fail = (detail: ErrorDetail, at = pos, length = 1): never => {
    throw new RegexSyntaxError(detail, at, length);
  };

  const readHex = (length: number) => {
    const digits = source.slice(pos, pos + length);
    if (digits.length !== length || !/^[0-9a-fA-F]+$/.test(digits)) return null;
    pos += length;
    return String.fromCharCode(Number.parseInt(digits, 16));
  };

  const readEscapedChar = (start: number): string => {
    const char = peek();
    if (char === undefined) return fail({ code: "trailingBackslash" }, start);
    pos += 1;
    const control = controlEscapes[char];
    if (control !== undefined) return control;
    if (char === "x") return readHex(2) ?? "x";
    if (char === "u") return readHex(4) ?? "u";
    if (char === "c") {
      const letter = peek();
      if (letter && /[A-Za-z]/.test(letter)) {
        pos += 1;
        return String.fromCharCode(letter.charCodeAt(0) % 32);
      }
      pos -= 1;
      return "\\";
    }
    return char;
  };

  const literal = (value: string, start: number): LiteralNode =>
    add({ type: "literal", id: nextId++, span: span(start), value });

  const parseSetItem = (): SetItem => {
    const start = pos;
    if (peek() === "\\") {
      pos += 1;
      const escaped = peek();
      if (escaped !== undefined && classEscapes[escaped]) {
        pos += 1;
        return { kind: "class", ...classEscapes[escaped] };
      }
      if (escaped === "b") {
        pos += 1;
        return { kind: "char", char: "\b" };
      }
      return { kind: "char", char: readEscapedChar(start) };
    }
    const char = peek() ?? "";
    pos += 1;
    return { kind: "char", char };
  };

  const parseSet = (): RegexNode => {
    const start = pos;
    pos += 1;
    const negated = peek() === "^";
    if (negated) pos += 1;
    const items: SetItem[] = [];
    while (peek() !== "]") {
      if (peek() === undefined) fail({ code: "unclosedSet" }, start);
      const itemStart = pos;
      const item = parseSetItem();
      if (peek() === "-" && peek(1) !== "]" && peek(1) !== undefined) {
        pos += 1;
        const end = parseSetItem();
        if (item.kind === "char" && end.kind === "char") {
          if (item.char > end.char)
            fail({ code: "rangeOrder", from: item.char, to: end.char }, itemStart, pos - itemStart);
          items.push({ kind: "range", from: item.char, to: end.char });
        } else {
          items.push(item, { kind: "char", char: "-" }, end);
        }
      } else {
        items.push(item);
      }
    }
    pos += 1;
    return add({ type: "set", id: nextId++, span: span(start), negated, items });
  };

  const parseGroup = (): RegexNode => {
    const start = pos;
    pos += 1;
    let kind: "capture" | "plain" | "ahead" | "behind" = "capture";
    let negated = false;
    let name: string | null = null;

    if (peek() === "?") {
      const next = peek(1);
      const after = peek(2);
      if (next === ":") {
        kind = "plain";
        pos += 2;
      } else if (next === "=" || next === "!") {
        kind = "ahead";
        negated = next === "!";
        pos += 2;
      } else if (next === "<" && (after === "=" || after === "!")) {
        kind = "behind";
        negated = after === "!";
        pos += 3;
      } else if (next === "<") {
        const close = source.indexOf(">", pos + 2);
        name = close === -1 ? "" : source.slice(pos + 2, close);
        if (!GROUP_NAME.test(name))
          fail({ code: "badGroupName" }, start, Math.max(close - start + 1, 3));
        pos = close + 1;
      } else {
        fail({ code: "unknownGroup" }, start, 2);
      }
    }

    const index = kind === "capture" ? ++nextGroup : null;
    const body = parseAlternation();
    if (peek() !== ")") fail({ code: "unclosedGroup" }, start);
    pos += 1;

    if (kind === "ahead" || kind === "behind") {
      return add({
        type: "look",
        id: nextId++,
        span: span(start),
        behind: kind === "behind",
        negated,
        body,
      });
    }
    return add({ type: "group", id: nextId++, span: span(start), index, name, body });
  };

  const parseEscape = (): RegexNode => {
    const start = pos;
    pos += 1;
    const char = peek();
    if (char !== undefined && classEscapes[char]) {
      pos += 1;
      return add({ type: "class", id: nextId++, span: span(start), ...classEscapes[char] });
    }
    if (char === "b" || char === "B") {
      pos += 1;
      const kind: AnchorKind = char === "b" ? "wordBoundary" : "notWordBoundary";
      return add({ type: "anchor", id: nextId++, span: span(start), kind });
    }
    if (char !== undefined && /[1-9]/.test(char)) {
      const digits = /^\d+/.exec(source.slice(pos))?.[0] ?? char;
      const group = Number(digits);
      pos += digits.length;
      if (group > groupCount) fail({ code: "missingGroup", group }, start, pos - start);
      return add({ type: "backref", id: nextId++, span: span(start), group, name: null });
    }
    if (char === "k" && peek(1) === "<" && groupNames.size > 0) {
      const close = source.indexOf(">", pos + 2);
      const name = close === -1 ? "" : source.slice(pos + 2, close);
      const group = groupNames.get(name);
      if (group === undefined)
        fail({ code: "missingName", name }, start, Math.max(close - start + 1, 2));
      pos = close + 1;
      return add({ type: "backref", id: nextId++, span: span(start), group: group ?? 0, name });
    }
    return literal(readEscapedChar(start), start);
  };

  const parseAtom = (): RegexNode => {
    const start = pos;
    const char = peek() ?? "";
    switch (char) {
      case "(":
        return parseGroup();
      case "[":
        return parseSet();
      case "\\":
        return parseEscape();
      case ".":
        pos += 1;
        return add({ type: "dot", id: nextId++, span: span(start) });
      case "^":
      case "$":
        pos += 1;
        return add({
          type: "anchor",
          id: nextId++,
          span: span(start),
          kind: char === "^" ? "start" : "end",
        });
      case "*":
      case "+":
      case "?":
        return fail({ code: "nothingToRepeat", char });
      default:
        if (char === "{" && readBraces() !== null)
          return fail({ code: "nothingToRepeat", char: "{" });
        pos += 1;
        return literal(char, start);
    }
  };

  const readBraces = () => {
    const match = /^\{(\d+)(,(\d*))?\}/.exec(source.slice(pos));
    if (!match) return null;
    const min = Number(match[1]);
    const max = match[2] === undefined ? min : match[3] ? Number(match[3]) : Infinity;
    return { min, max, length: match[0].length };
  };

  const parseQuantifier = (body: RegexNode): RegexNode => {
    const start = pos;
    const char = peek();
    let range: { min: number; max: number } | null = null;
    if (char === "*") range = { min: 0, max: Infinity };
    else if (char === "+") range = { min: 1, max: Infinity };
    else if (char === "?") range = { min: 0, max: 1 };
    if (range) {
      pos += 1;
    } else if (char === "{") {
      const braces = readBraces();
      if (!braces) return body;
      if (braces.min > braces.max) fail({ code: "quantifierOrder" }, start, braces.length);
      range = braces;
      pos += braces.length;
    } else {
      return body;
    }
    if (body.type === "anchor" || (body.type === "look" && body.behind)) {
      fail({ code: "cannotRepeat" }, start, pos - start);
    }
    const lazy = peek() === "?";
    if (lazy) pos += 1;
    const node: QuantifierNode = add({
      type: "quantifier",
      id: nextId++,
      span: { start: body.span.start, end: pos },
      min: range.min,
      max: range.max,
      lazy,
      body,
    });
    if (peek() === "*" || peek() === "+" || peek() === "?" || (peek() === "{" && readBraces())) {
      fail({ code: "doubleQuantifier" }, pos);
    }
    return node;
  };

  const mergeLiterals = (items: readonly RegexNode[]) => {
    const merged: RegexNode[] = [];
    for (const item of items) {
      const previous = merged.at(-1);
      if (
        item.type === "literal" &&
        previous?.type === "literal" &&
        previous.span.end === item.span.start
      ) {
        nodes.delete(previous.id);
        nodes.delete(item.id);
        merged[merged.length - 1] = add({
          type: "literal",
          id: previous.id,
          span: { start: previous.span.start, end: item.span.end },
          value: previous.value + item.value,
        });
      } else {
        merged.push(item);
      }
    }
    return merged;
  };

  const parseSequence = (): RegexNode => {
    const start = pos;
    const items: RegexNode[] = [];
    while (pos < source.length && peek() !== "|" && peek() !== ")") {
      items.push(parseQuantifier(parseAtom()));
    }
    const merged = mergeLiterals(items);
    const [only] = merged;
    if (merged.length === 1 && only) return only;
    return add({ type: "sequence", id: nextId++, span: span(start), items: merged });
  };

  function parseAlternation(): RegexNode {
    const start = pos;
    const options = [parseSequence()];
    while (peek() === "|") {
      pos += 1;
      options.push(parseSequence());
    }
    const [only] = options;
    if (options.length === 1 && only) return only;
    return add({ type: "alternation", id: nextId++, span: span(start), options });
  }

  const root = parseAlternation();
  if (pos < source.length) fail({ code: "unmatchedParen" }, pos);
  return { root, groupCount, groupNames, nodes };
}
