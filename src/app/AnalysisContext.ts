import { createContext, use } from "react";
import type { Analysis } from "../engine/analyze";
import type { Flags } from "../engine/ast";
import type { Phrases } from "../engine/phrases";

export type AnalysisValue = {
  analysis: Analysis;
  pattern: string;
  flags: Flags;
  text: string;
  phrases: Phrases;
};

export const AnalysisContext = createContext<AnalysisValue | null>(null);

export function useAnalysisValue() {
  const value = use(AnalysisContext);
  if (!value) throw new Error("useAnalysisValue must be used inside AnalysisContext");
  return value;
}
