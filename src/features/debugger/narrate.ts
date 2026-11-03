import type { Analysis } from "../../engine/analyze";
import type { Flags } from "../../engine/ast";
import { describeAtom, showChar } from "../../engine/explain";
import type { TraceEvent } from "../../engine/matcher";
import type { Phrases } from "../../engine/phrases";
import type { Messages } from "../../i18n/en";

type Ready = Extract<Analysis, { ok: true }>;

export type Narration = { tone: "idle" | "ok" | "fail" | "back" | "match"; text: string };

type Context = { text: string; flags: Flags; t: Messages; phrases: Phrases };

export function narrate(analysis: Ready, event: TraceEvent | null, context: Context): Narration {
  const { text, flags, t, phrases } = context;
  const quote = (value: string) => (value ? `“${value}”` : t.narrate.nothing);

  if (!event) return { tone: "idle", text: t.narrate.waiting };

  switch (event.type) {
    case "attempt": {
      const char = text[event.start];
      return {
        tone: "idle",
        text: t.narrate.attempt(event.start, char === undefined ? null : showChar(char, phrases)),
      };
    }
    case "match":
      return {
        tone: "match",
        text: t.narrate.arrived(quote(text.slice(event.start, event.end)), event.start, event.end),
      };
    case "backtrack": {
      const node = analysis.parsed.nodes.get(event.node);
      return {
        tone: "back",
        text: node?.type === "alternation" ? t.narrate.branch : t.narrate.repeat,
      };
    }
    case "step": {
      const node = analysis.parsed.nodes.get(event.node);
      const what = node ? describeAtom(node, flags, phrases) : t.narrate.station;
      const tone = event.ok ? "ok" : "fail";
      if (node?.type === "anchor" || event.end === event.pos) {
        return { tone, text: t.narrate.holds(what, event.ok) };
      }
      const seen =
        event.end > event.pos ? text.slice(event.pos, event.end) : (text[event.pos] ?? "");
      if (event.ok) return { tone, text: t.narrate.matched(what, quote(seen)) };
      return { tone, text: t.narrate.found(what, seen === "" ? t.narrate.endOfText : quote(seen)) };
    }
  }
}
