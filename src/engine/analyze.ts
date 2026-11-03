import type { Flags, ParsedRegex } from "./ast";
import { explain, type Explanation } from "./explain";
import { formatFlags } from "./flags";
import { layoutRegex, type Diagram } from "./layout";
import { runRegex, type Match, type RunResult } from "./matcher";
import { parseRegex, RegexSyntaxError } from "./parser";
import { en, type Phrases } from "./phrases";

export type Analysis =
  | { ok: false; error: RegexSyntaxError }
  | {
      ok: true;
      parsed: ParsedRegex;
      diagram: Diagram;
      run: RunResult;
      explanation: Explanation;
      verified: boolean | null;
    };

const sameAsNative = (pattern: string, flags: Flags, text: string, matches: readonly Match[]) => {
  try {
    const regex = new RegExp(pattern, `${formatFlags(flags).replace("g", "")}g`);
    const native = [...text.matchAll(regex)].slice(0, flags.global ? undefined : 1);
    return (
      native.length === matches.length &&
      native.every((match, index) => {
        const ours = matches[index];
        if (ours === undefined) return false;
        if (ours.start !== match.index || ours.value !== match[0]) return false;
        return match.slice(1).every((group, at) => {
          const capture = ours.captures[at];
          return (capture ? text.slice(capture.start, capture.end) : undefined) === group;
        });
      })
    );
  } catch {
    return null;
  }
};

export function analyze(
  pattern: string,
  flags: Flags,
  text: string,
  phrases: Phrases = en,
): Analysis {
  let parsed: ParsedRegex;
  try {
    parsed = parseRegex(pattern);
  } catch (error) {
    if (error instanceof RegexSyntaxError) return { ok: false, error };
    throw error;
  }
  const run = runRegex(parsed, flags, text);
  return {
    ok: true,
    parsed,
    diagram: layoutRegex(parsed.root, pattern, phrases),
    run,
    explanation: explain(parsed.root, flags, phrases),
    verified: run.status === "complete" ? sameAsNative(pattern, flags, text, run.matches) : null,
  };
}
