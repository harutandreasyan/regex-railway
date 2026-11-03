import { describe, expect, it } from "vitest";
import type { Flags } from "../../src/engine/ast";
import { runRegex } from "../../src/engine/matcher";
import { parseRegex } from "../../src/engine/parser";

const toFlags = (value: string): Flags => ({
  global: value.includes("g"),
  ignoreCase: value.includes("i"),
  multiline: value.includes("m"),
  dotAll: value.includes("s"),
});

const native = (pattern: string, flags: string, text: string) => {
  const regex = new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`);
  const all = [...text.matchAll(regex)].map((match) => ({
    start: match.index,
    value: match[0],
    groups: match.slice(1).map((group: string | undefined) => group ?? null),
  }));
  return flags.includes("g") ? all : all.slice(0, 1);
};

const ours = (pattern: string, flags: string, text: string) => {
  const result = runRegex(parseRegex(pattern), toFlags(flags), text);
  expect(result.status).toBe("complete");
  return result.matches.map((match) => ({
    start: match.start,
    value: match.value,
    groups: match.captures.map((capture) =>
      capture ? text.slice(capture.start, capture.end) : null,
    ),
  }));
};

const cases: [pattern: string, flags: string, texts: string[]][] = [
  ["abc", "g", ["abc", "xabcabc", "ab", ""]],
  ["a|b|cd", "g", ["abcd", "dcba", "c"]],
  ["colou?r", "g", ["color colour colouur"]],
  ["\\d+", "g", ["a1b22c333", "none"]],
  ["\\w+@\\w+\\.\\w{2,}", "g", ["mail me at hi@site.com or a@b.c"]],
  ["^\\s*$", "gm", ["a\n\n  \nb", ""]],
  ["^\\w+", "gm", ["one\ntwo\r\nthree"]],
  ["\\bcat\\b", "g", ["cat concat cat. bobcat"]],
  ["\\Bcat", "g", ["cat concat bobcat"]],
  ["[a-f0-9]{6}", "gi", ["#FFAA00 #bada55 #xyz123"]],
  ["[^aeiou\\s]+", "g", ["hello world"]],
  ["[\\d-x]+", "g", ["1-x2 y"]],
  ["(\\d{4})-(\\d{2})-(\\d{2})", "g", ["on 2024-02-29 and 1999-12-31"]],
  ["(?<year>\\d{4})/(?<month>\\d\\d)", "g", ["2026/10 1/1"]],
  ["(a)|(b)", "g", ["ab"]],
  ["(a+)+b", "g", ["aaab", "aa"]],
  ["(\\w)\\1", "g", ["hello bookkeeper"]],
  ["<(\\w+)>.*?</\\1>", "g", ["<b>bold</b> <i>x</b></i>"]],
  ["(?<q>['\"]).*?\\k<q>", "g", [`say "hi" or 'yo'`]],
  ["a.c", "g", ["abc a\nc a.c"]],
  ["a.c", "gs", ["a\nc"]],
  ["x*", "g", ["axxb"]],
  ["x*?", "g", ["xx"]],
  ["a{2,3}", "g", ["aaaaaaa"]],
  ["a{2,3}?", "g", ["aaaaaaa"]],
  ["a{2,}", "g", ["a aa aaaa"]],
  ["(?:ab)+", "g", ["ababab abx"]],
  ["\\d+(?=px)", "g", ["10px 20em 30px"]],
  ["\\d+(?!px|\\d)", "g", ["10px 20em 30"]],
  ["(?<=\\$)\\d+", "g", ["$40 and 50 and $6"]],
  ["(?<!\\$)\\b\\d+", "g", ["$40 and 50"]],
  ["^(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$", "", ["Passw0rdOK", "password", "Sh0rt"]],
  ["(a|ab)(c|bcd)(d*)", "", ["abcd"]],
  ["(a*)*b", "", ["aaab"]],
  ["(a*)+?$", "", ["aaa"]],
  ["(x)?y", "g", ["y xy"]],
  ["(?:(a)|b)+", "", ["ab"]],
  ["HELLO", "gi", ["hello HeLLo"]],
  ["[A-Z]+", "gi", ["mixed Case"]],
  ["\\x41\\u0042\\t", "g", ["AB\t"]],
  ["\\.\\*\\+\\?\\(\\)\\[\\]\\{\\}\\|\\\\\\/", "", [".*+?()[]{}|\\/"]],
  ["[]a]", "g", ["]a"]],
  ["[^]", "g", ["ab"]],
  ["a{,2}", "g", ["a{,2}"]],
  ["\\b", "g", ["hi there"]],
  ["$", "gm", ["a\nb"]],
  ["(.+)\\1", "g", ["\u{1F680}\u{1F680} \u{1F600}x\u{1F600}x"]],
  [".", "g", ["\u{1F680}"]],
];

describe("matches exactly like the browser's RegExp", () => {
  for (const [pattern, flags, texts] of cases) {
    for (const text of texts) {
      it(`/${pattern}/${flags} on ${JSON.stringify(text)}`, () => {
        expect(ours(pattern, flags, text)).toEqual(native(pattern, flags, text));
      });
    }
  }
});

describe("tracing", () => {
  it("records attempts, steps and the final match", () => {
    const result = runRegex(parseRegex("b"), toFlags(""), "ab");
    expect(result.trace.map((event) => event.type)).toEqual([
      "attempt",
      "step",
      "attempt",
      "step",
      "match",
    ]);
  });

  it("records backtracking", () => {
    const result = runRegex(parseRegex("a*ab"), toFlags(""), "aab");
    expect(result.trace.some((event) => event.type === "backtrack")).toBe(true);
    expect(result.matches[0]?.value).toBe("aab");
  });

  it("stops catastrophic backtracking at the step budget", () => {
    const result = runRegex(parseRegex("^(a+)+$"), toFlags(""), `${"a".repeat(28)}!`, {
      budget: 50_000,
    });
    expect(result.status).toBe("budget");
    expect(result.steps).toBeGreaterThan(50_000);
  });

  it("caps the trace but keeps counting steps", () => {
    const result = runRegex(parseRegex("a"), toFlags("g"), "a".repeat(100), { traceLimit: 10 });
    expect(result.trace).toHaveLength(10);
    expect(result.traceTruncated).toBe(true);
    expect(result.matches).toHaveLength(100);
  });
});

describe("step counting", () => {
  it("counts exactly one step per trace event when nothing is truncated", () => {
    const result = runRegex(parseRegex("(a|b)*c"), toFlags("g"), "abacab c");
    expect(result.traceTruncated).toBe(false);
    expect(result.steps).toBe(result.trace.length);
  });
});
