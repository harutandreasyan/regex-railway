import { describe, expect, it } from "vitest";
import { layoutRegex, STATION_HEIGHT } from "../../src/engine/layout";
import { parseRegex } from "../../src/engine/parser";

const diagramOf = (pattern: string) => {
  const parsed = parseRegex(pattern);
  return { parsed, diagram: layoutRegex(parsed.root, pattern) };
};

describe("diagram layout", () => {
  it("creates a station for every atom", () => {
    const { diagram } = diagramOf(String.raw`^ab\d[x-z].\1?$`.replace(String.raw`\1?`, ""));
    expect(diagram.stations.map((station) => station.label)).toEqual([
      "start",
      "ab",
      "digit",
      "[x-z]",
      "any char",
      "end",
    ]);
  });

  it("lays stations left to right on one line in a sequence", () => {
    const { diagram } = diagramOf("a\\db");
    const xs = diagram.stations.map((station) => station.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(new Set(diagram.stations.map((station) => station.y)).size).toBe(1);
  });

  it("stacks alternatives vertically without overlap", () => {
    const { diagram } = diagramOf("cat|dog|bird");
    const ys = diagram.stations.map((station) => station.y);
    ys.slice(1).forEach((y, index) => {
      expect(y).toBeGreaterThanOrEqual((ys[index] ?? 0) + STATION_HEIGHT);
    });
  });

  it("draws a loop for repeats and a bypass for optional parts", () => {
    expect(diagramOf("a+").diagram.tracks.map((track) => track.kind)).toContain("loop");
    expect(diagramOf("a?").diagram.tracks.map((track) => track.kind)).toContain("skip");
    expect(diagramOf("a*?").diagram.tracks.map((track) => track.kind)).toEqual(
      expect.arrayContaining(["skip", "lazy"]),
    );
  });

  it("frames groups with their number and colors their stations", () => {
    const { diagram } = diagramOf("(?<year>\\d+)-(x)");
    expect(diagram.frames.map((frame) => frame.label)).toEqual(["#1 year", "#2"]);
    expect(diagram.stations.map((station) => station.lane)).toEqual([1, 0, 2]);
  });

  it("gives every node a point for the train", () => {
    const { parsed, diagram } = diagramOf("(a|b)+c");
    for (const node of parsed.nodes.values()) {
      if (node.type !== "sequence") expect(diagram.points.has(node.id)).toBe(true);
    }
  });

  it("fits everything inside the canvas", () => {
    const { diagram } = diagramOf(String.raw`(?:(\w+)\s){2,}|x*`);
    for (const station of diagram.stations) {
      expect(station.x + station.width).toBeLessThanOrEqual(diagram.width);
      expect(station.y + station.height).toBeLessThanOrEqual(diagram.height);
    }
  });
});
