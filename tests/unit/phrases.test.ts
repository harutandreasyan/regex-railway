import { describe, expect, it } from "vitest";
import { describeNode, explain } from "../../src/engine/explain";
import { parseFlags } from "../../src/engine/flags";
import { layoutRegex } from "../../src/engine/layout";
import { parseRegex } from "../../src/engine/parser";
import { en, ru } from "../../src/engine/phrases";

describe("Russian phrases", () => {
  it("explains a pattern in Russian", () => {
    const { root } = parseRegex(String.raw`(?<year>\d{4})-x?`);
    const tree = explain(root, parseFlags("g"), ru);
    const texts = JSON.stringify(tree);
    expect(texts).toContain("Запомнить как группу #1 «year»:");
    expect(texts).toContain("Повторить ровно 4 раза:");
    expect(texts).toContain("Цифра (0–9)");
    expect(texts).toContain("Повторить необязательно (ноль или один раз):");
  });

  it("uses Russian plural forms", () => {
    expect(ru.times({ min: 1, max: 1, lazy: false })).toBe("ровно 1 раз");
    expect(ru.times({ min: 3, max: 3, lazy: false })).toBe("ровно 3 раза");
    expect(ru.times({ min: 5, max: 5, lazy: false })).toBe("ровно 5 раз");
    expect(ru.times({ min: 11, max: 11, lazy: false })).toBe("ровно 11 раз");
    expect(ru.note({ min: 2, max: Infinity, lazy: true })).toBe("2+ раза · лениво");
  });

  it("labels map stations in the chosen language", () => {
    const { root } = parseRegex(String.raw`^\d.$`);
    const labels = (phrases: typeof en) =>
      layoutRegex(root, String.raw`^\d.$`, phrases).stations.map((station) => station.label);
    expect(labels(en)).toEqual(["start", "digit", "any char", "end"]);
    expect(labels(ru)).toEqual(["начало", "цифра", "любой", "конец"]);
  });

  it("describes single nodes without the trailing colon", () => {
    const { root } = parseRegex("a+");
    expect(describeNode(root, parseFlags(""), ru)).toBe("Повторить один или больше раз");
  });

  it("translates every parser error", () => {
    expect(ru.error({ code: "unclosedGroup" })).toBe("Эта группа не закрыта скобкой )");
    expect(en.error({ code: "nothingToRepeat", char: "*" })).toBe(
      '"*" has nothing before it to repeat',
    );
  });
});
