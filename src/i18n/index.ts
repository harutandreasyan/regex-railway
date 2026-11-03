import { create } from "zustand";
import { phrasesFor } from "../engine/phrases";
import { en, type Messages } from "./en";
import { ru } from "./ru";

export type Lang = "en" | "ru";

const KEY = "railway-lang";

const isLang = (value: unknown): value is Lang => value === "en" || value === "ru";

const readLang = (): Lang => {
  const fromUrl = new URLSearchParams(window.location.search).get("lang");
  if (isLang(fromUrl)) return fromUrl;
  try {
    const stored = localStorage.getItem(KEY);
    return isLang(stored) ? stored : "en";
  } catch {
    return "en";
  }
};

const dictionaries: Record<Lang, Messages> = { en, ru };

type LangState = { lang: Lang; setLang: (lang: Lang) => void };

export const useLang = create<LangState>()((set) => ({
  lang: readLang(),
  setLang: (lang) => {
    set({ lang });
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      set({ lang });
    }
  },
}));

export const useT = () => dictionaries[useLang((state) => state.lang)];

export const usePhrases = () => phrasesFor(useLang((state) => state.lang));
