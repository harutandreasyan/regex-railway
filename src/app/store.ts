import { create } from "zustand";
import type { Flags } from "../engine/ast";
import { examples, findExample, variantOf } from "../engine/examples";
import { useLang } from "../i18n";
import type { FlagKey } from "../engine/flags";
import { parseFlags } from "../engine/flags";
import { MAX_PATTERN, MAX_TEXT, type Shared } from "../engine/share";

export type Speed = 1 | 2;

export const speeds: Record<Speed, { interval: number }> = {
  1: { interval: 1100 },
  2: { interval: 650 },
};

type State = {
  pattern: string;
  flags: Flags;
  text: string;
  exampleId: string | null;
  step: number;
  playing: boolean;
  speed: Speed;
  focus: number | null;
};

type Actions = {
  setPattern: (pattern: string) => void;
  toggleFlag: (key: FlagKey) => void;
  setText: (text: string) => void;
  loadExample: (id: string) => void;
  localizeExample: () => void;
  loadShared: (shared: Shared) => void;
  setStep: (step: number) => void;
  setPlaying: (playing: boolean) => void;
  setSpeed: (speed: Speed) => void;
  setFocus: (focus: number | null) => void;
};

const first = examples[0];
const firstVariant = first ? variantOf(first, useLang.getState().lang) : null;

const reset = { step: 0, playing: false } as const;

export const useRailway = create<State & Actions>()((set, get) => ({
  pattern: firstVariant?.pattern ?? "",
  flags: parseFlags(firstVariant?.flags ?? "g"),
  text: firstVariant?.text ?? "",
  exampleId: first?.id ?? null,
  step: 0,
  playing: false,
  speed: 2,
  focus: null,

  setPattern: (pattern) => {
    set({ pattern: pattern.slice(0, MAX_PATTERN), exampleId: null, ...reset });
  },
  toggleFlag: (key) => {
    set((state) => ({
      flags: { ...state.flags, [key]: !state.flags[key] },
      exampleId: null,
      ...reset,
    }));
  },
  setText: (text) => {
    set({ text: text.slice(0, MAX_TEXT), exampleId: null, ...reset });
  },
  loadExample: (id) => {
    const example = findExample(id);
    if (!example) return;
    const variant = variantOf(example, useLang.getState().lang);
    set({
      pattern: variant.pattern,
      flags: parseFlags(variant.flags),
      text: variant.text,
      exampleId: example.id,
      step: 0,
      playing: true,
      focus: null,
    });
  },
  localizeExample: () => {
    const id = get().exampleId;
    const example = id === null ? undefined : findExample(id);
    if (!example) return;
    const variant = variantOf(example, useLang.getState().lang);
    set({
      pattern: variant.pattern,
      flags: parseFlags(variant.flags),
      text: variant.text,
      ...reset,
    });
  },
  loadShared: ({ pattern, flags, text }) => {
    set({ pattern, flags, text, exampleId: null, ...reset });
  },
  setStep: (step) => {
    set({ step: Math.max(0, step) });
  },
  setPlaying: (playing) => {
    set({ playing });
  },
  setSpeed: (speed) => {
    set({ speed });
  },
  setFocus: (focus) => {
    set({ focus });
  },
}));
