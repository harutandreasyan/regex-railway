import type { RegexNode } from "./ast";

export type TokenKind =
  | "literal"
  | "class"
  | "set"
  | "dot"
  | "anchor"
  | "backref"
  | "group"
  | "look"
  | "quantifier"
  | "alternation"
  | "plain";

export type Token = { start: number; end: number; kind: TokenKind; node: number | null };

const collect = (node: RegexNode, tokens: Token[]) => {
  const push = (start: number, end: number, kind: TokenKind) => {
    if (end > start) tokens.push({ start, end, kind, node: node.id });
  };
  switch (node.type) {
    case "literal":
    case "class":
    case "set":
    case "dot":
    case "anchor":
    case "backref":
      push(node.span.start, node.span.end, node.type);
      return;
    case "group":
    case "look":
      push(node.span.start, node.body.span.start, node.type);
      collect(node.body, tokens);
      push(node.span.end - 1, node.span.end, node.type);
      return;
    case "quantifier":
      collect(node.body, tokens);
      push(node.body.span.end, node.span.end, "quantifier");
      return;
    case "alternation":
      node.options.forEach((option, index) => {
        collect(option, tokens);
        if (index < node.options.length - 1)
          push(option.span.end, option.span.end + 1, "alternation");
      });
      return;
    case "sequence":
      for (const item of node.items) collect(item, tokens);
      return;
  }
};

export function tokenize(root: RegexNode | null, source: string): Token[] {
  const found: Token[] = [];
  if (root) collect(root, found);
  found.sort((a, b) => a.start - b.start);
  const tokens: Token[] = [];
  let cursor = 0;
  for (const token of found) {
    if (token.start < cursor) continue;
    if (token.start > cursor)
      tokens.push({ start: cursor, end: token.start, kind: "plain", node: null });
    tokens.push(token);
    cursor = token.end;
  }
  if (cursor < source.length)
    tokens.push({ start: cursor, end: source.length, kind: "plain", node: null });
  return tokens;
}
