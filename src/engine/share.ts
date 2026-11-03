import type { Flags } from "./ast";
import { formatFlags, parseFlags } from "./flags";

export type Shared = { pattern: string; flags: Flags; text: string };

export const MAX_TEXT = 2_000;
export const MAX_PATTERN = 400;

export const encodeShare = ({ pattern, flags, text }: Shared) =>
  new URLSearchParams({ p: pattern, f: formatFlags(flags), t: text }).toString();

export const decodeShare = (hash: string): Shared | null => {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const pattern = params.get("p");
  if (pattern === null) return null;
  return {
    pattern: pattern.slice(0, MAX_PATTERN),
    flags: parseFlags(params.get("f") ?? ""),
    text: (params.get("t") ?? "").slice(0, MAX_TEXT),
  };
};
