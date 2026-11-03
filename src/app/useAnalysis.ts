import { useDeferredValue, useMemo } from "react";
import { analyze } from "../engine/analyze";
import { usePhrases } from "../i18n";
import { useRailway } from "./store";

export function useAnalysis() {
  const pattern = useDeferredValue(useRailway((state) => state.pattern));
  const flags = useDeferredValue(useRailway((state) => state.flags));
  const text = useDeferredValue(useRailway((state) => state.text));
  const phrases = usePhrases();
  const analysis = useMemo(
    () => analyze(pattern, flags, text, phrases),
    [pattern, flags, text, phrases],
  );
  return { analysis, pattern, flags, text, phrases };
}
