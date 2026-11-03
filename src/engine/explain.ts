import { childrenOf, type Flags, type RegexNode, type SetItem } from "./ast";
import { en, type Phrases } from "./phrases";
import { codeUnits } from "./text";

export type Explanation = {
  id: number;
  text: string;
  children: readonly Explanation[];
};

const textEscapes: Record<string, string> = {
  "\n": "\\n",
  "\r": "\\r",
  "\t": "\\t",
  "\f": "\\f",
  "\v": "\\v",
  "\0": "\\0",
  "\b": "\\b",
};

export const showChar = (char: string, phrases: Phrases = en) =>
  phrases.charNames[char] ?? phrases.quote(char);

export const showText = (value: string, phrases: Phrases = en) =>
  value.length === 1
    ? showChar(value, phrases)
    : phrases.quote(
        codeUnits(value)
          .map((char) => textEscapes[char] ?? char)
          .join(""),
      );

const describeItem = (item: SetItem, phrases: Phrases) => {
  switch (item.kind) {
    case "char":
      return showChar(item.char, phrases);
    case "range":
      return `${item.from}–${item.to}`;
    case "class":
      return item.negated ? phrases.classes[item.class][1] : phrases.classPlural[item.class];
  }
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const describeAtom = (node: RegexNode, flags: Flags, phrases: Phrases = en): string => {
  switch (node.type) {
    case "literal":
      return phrases.literal(
        showText(node.value, phrases),
        node.value.length === 1,
        flags.ignoreCase,
      );
    case "dot":
      return phrases.dot(flags.dotAll);
    case "class":
      return capitalize(phrases.classes[node.class][node.negated ? 1 : 0]);
    case "set":
      if (!node.items.length) return phrases.emptySet(node.negated);
      return phrases.set(
        node.items.map((item) => describeItem(item, phrases)).join(", "),
        node.negated,
      );
    case "anchor":
      return phrases.anchor(node.kind, flags.multiline);
    case "backref":
      return phrases.backref(node.name ? phrases.quote(node.name) : `#${node.group}`);
    default:
      return "";
  }
};

export const headline = (node: RegexNode, flags: Flags, phrases: Phrases = en): string => {
  switch (node.type) {
    case "sequence":
      return phrases.sequence(node.items.length === 0);
    case "alternation":
      return phrases.alternation(node.options.length);
    case "group":
      return phrases.group(node.index, node.name);
    case "look":
      return phrases.look(node.negated, node.behind);
    case "quantifier":
      return phrases.repeat(phrases.times(node));
    default:
      return describeAtom(node, flags, phrases);
  }
};

export const describeNode = (node: RegexNode, flags: Flags, phrases: Phrases = en) =>
  headline(node, flags, phrases).replace(/:$/, "");

export function explain(node: RegexNode, flags: Flags, phrases: Phrases = en): Explanation {
  return {
    id: node.id,
    text: headline(node, flags, phrases),
    children: childrenOf(node).map((child) => explain(child, flags, phrases)),
  };
}
