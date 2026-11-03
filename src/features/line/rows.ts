import { childrenOf, type Flags, type ParsedRegex, type RegexNode } from "../../engine/ast";
import { describeNode } from "../../engine/explain";
import { stationLabel, type StationKind } from "../../engine/layout";
import type { Phrases } from "../../engine/phrases";

export type Row = {
  id: number;
  depth: number;
  text: string;
  station: { kind: StationKind; label: string } | null;
  lane: number;
};

const isStation = (node: RegexNode) =>
  node.type === "literal" ||
  node.type === "dot" ||
  node.type === "class" ||
  node.type === "set" ||
  node.type === "anchor" ||
  node.type === "backref";

export function buildRows(
  parsed: ParsedRegex,
  source: string,
  flags: Flags,
  phrases: Phrases,
): Row[] {
  const rows: Row[] = [];
  const visit = (node: RegexNode, depth: number, lane: number) => {
    if (node.type === "sequence") {
      for (const item of node.items) visit(item, depth, lane);
      return;
    }
    const [kind, label] = stationLabel(node, source, phrases);
    rows.push({
      id: node.id,
      depth,
      text: describeNode(node, flags, phrases),
      station: isStation(node) ? { kind, label } : null,
      lane,
    });
    const innerLane = node.type === "group" && node.index !== null ? node.index : lane;
    for (const child of childrenOf(node)) visit(child, depth + 1, innerLane);
  };
  visit(parsed.root, 0, 0);
  return rows;
}
