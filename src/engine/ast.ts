export type Span = { start: number; end: number };

export type ClassKind = "digit" | "word" | "space";

export type SetItem =
  | { kind: "char"; char: string }
  | { kind: "range"; from: string; to: string }
  | { kind: "class"; class: ClassKind; negated: boolean };

type Base = { id: number; span: Span };

export type LiteralNode = Base & { type: "literal"; value: string };
export type DotNode = Base & { type: "dot" };
export type ClassNode = Base & { type: "class"; class: ClassKind; negated: boolean };
export type SetNode = Base & { type: "set"; negated: boolean; items: readonly SetItem[] };
export type AnchorKind = "start" | "end" | "wordBoundary" | "notWordBoundary";
export type AnchorNode = Base & { type: "anchor"; kind: AnchorKind };
export type BackrefNode = Base & { type: "backref"; group: number; name: string | null };

export type SequenceNode = Base & { type: "sequence"; items: readonly RegexNode[] };
export type AlternationNode = Base & { type: "alternation"; options: readonly RegexNode[] };
export type GroupNode = Base & {
  type: "group";
  index: number | null;
  name: string | null;
  body: RegexNode;
};
export type LookNode = Base & { type: "look"; behind: boolean; negated: boolean; body: RegexNode };
export type QuantifierNode = Base & {
  type: "quantifier";
  min: number;
  max: number;
  lazy: boolean;
  body: RegexNode;
};

export type AtomNode = LiteralNode | DotNode | ClassNode | SetNode | AnchorNode | BackrefNode;

export type RegexNode =
  AtomNode | SequenceNode | AlternationNode | GroupNode | LookNode | QuantifierNode;

export type Flags = { global: boolean; ignoreCase: boolean; multiline: boolean; dotAll: boolean };

export type ParsedRegex = {
  root: RegexNode;
  groupCount: number;
  groupNames: ReadonlyMap<string, number>;
  nodes: ReadonlyMap<number, RegexNode>;
};

export const childrenOf = (node: RegexNode): readonly RegexNode[] => {
  switch (node.type) {
    case "sequence":
      return node.items;
    case "alternation":
      return node.options;
    case "group":
    case "look":
    case "quantifier":
      return [node.body];
    default:
      return [];
  }
};
