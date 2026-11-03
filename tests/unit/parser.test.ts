import { describe, expect, it } from "vitest";
import { parseRegex, RegexSyntaxError } from "../../src/engine/parser";

const errorOf = (pattern: string) => {
  try {
    parseRegex(pattern);
  } catch (error) {
    if (error instanceof RegexSyntaxError)
      return { message: error.message, position: error.position };
    throw error;
  }
  return null;
};

describe("parser", () => {
  it("merges neighbouring characters into one literal", () => {
    const { root } = parseRegex("hello");
    expect(root).toMatchObject({ type: "literal", value: "hello", span: { start: 0, end: 5 } });
  });

  it("binds a quantifier to the last character only", () => {
    const { root } = parseRegex("abc+");
    expect(root).toMatchObject({
      type: "sequence",
      items: [
        { type: "literal", value: "ab" },
        { type: "quantifier", min: 1, max: Infinity, body: { type: "literal", value: "c" } },
      ],
    });
  });

  it("parses alternation, groups and named groups", () => {
    const parsed = parseRegex("(?<word>\\w+)|(?:x)|(y)");
    expect(parsed.groupCount).toBe(2);
    expect(parsed.groupNames.get("word")).toBe(1);
    expect(parsed.root).toMatchObject({
      type: "alternation",
      options: [
        { type: "group", index: 1, name: "word" },
        { type: "group", index: null },
        { type: "group", index: 2 },
      ],
    });
  });

  it("parses lookarounds", () => {
    expect(parseRegex("(?<!a)(?=b)").root).toMatchObject({
      type: "sequence",
      items: [
        { type: "look", behind: true, negated: true },
        { type: "look", behind: false, negated: false },
      ],
    });
  });

  it("parses sets with ranges, classes and negation", () => {
    expect(parseRegex("[^a-z\\d_]").root).toMatchObject({
      type: "set",
      negated: true,
      items: [
        { kind: "range", from: "a", to: "z" },
        { kind: "class", class: "digit", negated: false },
        { kind: "char", char: "_" },
      ],
    });
  });

  it("parses counted and lazy quantifiers", () => {
    expect(parseRegex("a{2,5}?").root).toMatchObject({
      type: "quantifier",
      min: 2,
      max: 5,
      lazy: true,
    });
    expect(parseRegex("a{3}").root).toMatchObject({ min: 3, max: 3, lazy: false });
    expect(parseRegex("a{3,}").root).toMatchObject({ min: 3, max: Infinity });
  });

  it("registers every node by id", () => {
    const parsed = parseRegex("(a|b)+c");
    for (const [id, node] of parsed.nodes) expect(node.id).toBe(id);
    expect(parsed.nodes.get(parsed.root.id)).toBe(parsed.root);
  });

  it.each([
    ["(abc", "This group is never closed with )", 0],
    ["abc)", "This ) has no matching (", 3],
    ["[abc", "This character set is never closed with ]", 0],
    ["*a", '"*" has nothing before it to repeat', 0],
    ["a**", "A quantifier cannot be repeated directly", 2],
    ["a{5,2}", "The numbers in {min,max} are out of order", 1],
    ["[z-a]", "Range z-a is out of order", 1],
    ["(a)\\2", "There is no group #2 to refer back to", 3],
    ["(?<1x>a)", "Group names must start with a letter and use only letters, digits or _", 0],
    ["(?<n>a)(?<n>b)", 'Group name "n" is used twice', 7],
    ["(?x)", "Unknown group type after (?", 0],
    ["abc\\", "A pattern cannot end with a backslash", 3],
    ["^*", "Anchors and lookbehinds cannot be repeated", 1],
  ])("explains %s", (pattern, message, position) => {
    expect(errorOf(pattern)).toEqual({ message, position });
  });
});

describe("error details", () => {
  it("exposes a machine-readable code with its parameters", () => {
    try {
      parseRegex("(a)\\3");
    } catch (error) {
      expect(error).toBeInstanceOf(RegexSyntaxError);
      if (error instanceof RegexSyntaxError)
        expect(error.detail).toEqual({ code: "missingGroup", group: 3 });
    }
  });
});
