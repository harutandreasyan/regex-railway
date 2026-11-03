import type { Flags } from "./ast";

export type FlagKey = keyof Flags;

export const flagLetters: Record<FlagKey, string> = {
  global: "g",
  ignoreCase: "i",
  multiline: "m",
  dotAll: "s",
};

export const flagKeys = Object.keys(flagLetters) as FlagKey[];

export const parseFlags = (value: string): Flags => ({
  global: value.includes("g"),
  ignoreCase: value.includes("i"),
  multiline: value.includes("m"),
  dotAll: value.includes("s"),
});

export const formatFlags = (flags: Flags) =>
  flagKeys
    .filter((key) => flags[key])
    .map((key) => flagLetters[key])
    .join("");
