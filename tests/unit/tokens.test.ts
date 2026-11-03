import { describe, expect, it } from "vitest";
import { parseRegex } from "../../src/engine/parser";
import { tokenize } from "../../src/engine/tokens";

const kinds = (pattern: string) =>
  tokenize(parseRegex(pattern).root, pattern).map((token) => [
    pattern.slice(token.start, token.end),
    token.kind,
  ]);

describe("tokens", () => {
  it("covers the pattern without gaps or overlaps", () => {
    const pattern = String.raw`^(?<y>\d{4})-(?:a|b)+?[^x]\1(?=z)$`;
    const tokens = tokenize(parseRegex(pattern).root, pattern);
    expect(tokens.map((token) => pattern.slice(token.start, token.end)).join("")).toBe(pattern);
    tokens.slice(1).forEach((token, index) => {
      expect(token.start).toBe(tokens[index]?.end);
    });
  });

  it("classifies every piece", () => {
    expect(kinds(String.raw`(a|\d)+?$`)).toEqual([
      ["(", "group"],
      ["a", "literal"],
      ["|", "alternation"],
      [String.raw`\d`, "class"],
      [")", "group"],
      ["+?", "quantifier"],
      ["$", "anchor"],
    ]);
  });
});
