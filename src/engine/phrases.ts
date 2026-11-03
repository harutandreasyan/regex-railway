import type { AnchorKind, ClassKind } from "./ast";

export type ErrorDetail =
  | { code: "trailingBackslash" }
  | { code: "unclosedSet" }
  | { code: "rangeOrder"; from: string; to: string }
  | { code: "badGroupName" }
  | { code: "unknownGroup" }
  | { code: "unclosedGroup" }
  | { code: "missingGroup"; group: number }
  | { code: "missingName"; name: string }
  | { code: "nothingToRepeat"; char: string }
  | { code: "quantifierOrder" }
  | { code: "cannotRepeat" }
  | { code: "doubleQuantifier" }
  | { code: "unmatchedParen" }
  | { code: "duplicateName"; name: string };

export type Repeat = { min: number; max: number; lazy: boolean };

export type Phrases = {
  charNames: Readonly<Record<string, string>>;
  quote: (text: string) => string;
  classes: Readonly<Record<ClassKind, readonly [string, string]>>;
  classPlural: Readonly<Record<ClassKind, string>>;
  times: (repeat: Repeat) => string;
  literal: (text: string, single: boolean, anyCase: boolean) => string;
  dot: (dotAll: boolean) => string;
  emptySet: (negated: boolean) => string;
  set: (list: string, negated: boolean) => string;
  anchor: (kind: AnchorKind, multiline: boolean) => string;
  backref: (reference: string) => string;
  sequence: (empty: boolean) => string;
  alternation: (count: number) => string;
  group: (index: number | null, name: string | null) => string;
  look: (negated: boolean, behind: boolean) => string;
  repeat: (times: string) => string;
  station: {
    anyChar: string;
    classes: Readonly<Record<ClassKind, readonly [string, string]>>;
    anchors: Readonly<Record<AnchorKind, string>>;
    sameAs: (reference: string) => string;
  };
  note: (repeat: Repeat) => string;
  frame: { group: string; look: (negated: boolean, behind: boolean) => string };
  error: (detail: ErrorDetail) => string;
};

const pluralRu = (count: number, one: string, few: string, many: string) => {
  const tens = count % 100;
  const units = count % 10;
  if (tens >= 11 && tens <= 14) return many;
  if (units === 1) return one;
  if (units >= 2 && units <= 4) return few;
  return many;
};

const timesRu = (count: number) => pluralRu(count, "раз", "раза", "раз");

export const en: Phrases = {
  charNames: {
    " ": "a space",
    "\n": "a new line",
    "\r": "a carriage return",
    "\t": "a tab",
    "\f": "a form feed",
    "\v": "a vertical tab",
    "\0": "a null character",
    "\b": "a backspace",
  },
  quote: (text) => `"${text}"`,
  classes: {
    digit: ["a digit (0–9)", "anything except a digit"],
    word: ["a letter, digit or _", "anything except a letter, digit or _"],
    space: ["whitespace (space, tab, new line…)", "anything except whitespace"],
  },
  classPlural: { digit: "digits", word: "letters, digits or _", space: "whitespace" },
  times: ({ min, max, lazy }) => {
    const base =
      min === 0 && max === Infinity
        ? "zero or more times"
        : min === 1 && max === Infinity
          ? "one or more times"
          : min === 0 && max === 1
            ? "optional (zero or one time)"
            : max === Infinity
              ? `at least ${min} times`
              : min === max
                ? `exactly ${min} ${min === 1 ? "time" : "times"}`
                : `${min} to ${max} times`;
    return lazy ? `${base}, as few as possible` : base;
  },
  literal: (text, single, anyCase) =>
    `${single ? "The character" : "The text"} ${text}${anyCase ? " (any case)" : ""}`,
  dot: (dotAll) => (dotAll ? "Any character at all" : "Any character except a line break"),
  emptySet: (negated) =>
    negated ? "Any character at all" : "Nothing (an empty set never matches)",
  set: (list, negated) => (negated ? `Any character except ${list}` : `One of: ${list}`),
  anchor: (kind, multiline) =>
    ({
      start: multiline ? "Start of a line" : "Start of the text",
      end: multiline ? "End of a line" : "End of the text",
      wordBoundary: "A word boundary (edge between a word and a non-word)",
      notWordBoundary: "Not a word boundary",
    })[kind],
  backref: (reference) => `The same text that group ${reference} matched`,
  sequence: (empty) => (empty ? "Nothing (always matches an empty string)" : "In this order:"),
  alternation: (count) => `Either one of ${count} options:`,
  group: (index, name) =>
    index === null
      ? "Group (not remembered):"
      : `Remember as group #${index}${name ? ` "${name}"` : ""}:`,
  look: (negated, behind) =>
    `Check that it is ${negated ? "not " : ""}${behind ? "preceded" : "followed"} by (without consuming it):`,
  repeat: (times) => `Repeat ${times}:`,
  station: {
    anyChar: "any char",
    classes: {
      digit: ["digit", "not digit"],
      word: ["word char", "not word char"],
      space: ["space", "not space"],
    },
    anchors: { start: "start", end: "end", wordBoundary: "word edge", notWordBoundary: "not edge" },
    sameAs: (reference) => `same as ${reference}`,
  },
  note: ({ min, max, lazy }) => {
    const base =
      max === Infinity
        ? min === 0
          ? "any number"
          : `${min}+ times`
        : min === max
          ? `${min}×`
          : `${min}–${max} times`;
    return lazy ? `${base} · lazy` : base;
  },
  frame: {
    group: "group",
    look: (negated, behind) => `${negated ? "not " : ""}${behind ? "preceded by" : "followed by"}`,
  },
  error: (detail) => {
    switch (detail.code) {
      case "trailingBackslash":
        return "A pattern cannot end with a backslash";
      case "unclosedSet":
        return "This character set is never closed with ]";
      case "rangeOrder":
        return `Range ${detail.from}-${detail.to} is out of order`;
      case "badGroupName":
        return "Group names must start with a letter and use only letters, digits or _";
      case "unknownGroup":
        return "Unknown group type after (?";
      case "unclosedGroup":
        return "This group is never closed with )";
      case "missingGroup":
        return `There is no group #${detail.group} to refer back to`;
      case "missingName":
        return `There is no group named "${detail.name}"`;
      case "nothingToRepeat":
        return `"${detail.char}" has nothing before it to repeat`;
      case "quantifierOrder":
        return "The numbers in {min,max} are out of order";
      case "cannotRepeat":
        return "Anchors and lookbehinds cannot be repeated";
      case "doubleQuantifier":
        return "A quantifier cannot be repeated directly";
      case "unmatchedParen":
        return "This ) has no matching (";
      case "duplicateName":
        return `Group name "${detail.name}" is used twice`;
    }
  },
};

export const ru: Phrases = {
  charNames: {
    " ": "пробел",
    "\n": "перенос строки",
    "\r": "возврат каретки",
    "\t": "табуляция",
    "\f": "перевод страницы",
    "\v": "вертикальная табуляция",
    "\0": "нулевой символ",
    "\b": "backspace",
  },
  quote: (text) => `«${text}»`,
  classes: {
    digit: ["цифра (0–9)", "что угодно, кроме цифры"],
    word: ["буква, цифра или _", "что угодно, кроме буквы, цифры или _"],
    space: [
      "пробельный символ (пробел, табуляция, перенос…)",
      "что угодно, кроме пробельного символа",
    ],
  },
  classPlural: { digit: "цифры", word: "буквы, цифры или _", space: "пробельные символы" },
  times: ({ min, max, lazy }) => {
    const base =
      min === 0 && max === Infinity
        ? "ноль или больше раз"
        : min === 1 && max === Infinity
          ? "один или больше раз"
          : min === 0 && max === 1
            ? "необязательно (ноль или один раз)"
            : max === Infinity
              ? `не меньше ${min} ${timesRu(min)}`
              : min === max
                ? `ровно ${min} ${timesRu(min)}`
                : `от ${min} до ${max} ${timesRu(max)}`;
    return lazy ? `${base}, как можно меньше` : base;
  },
  literal: (text, single, anyCase) =>
    `${single ? "Символ" : "Текст"} ${text}${anyCase ? " (любой регистр)" : ""}`,
  dot: (dotAll) => (dotAll ? "Совсем любой символ" : "Любой символ, кроме переноса строки"),
  emptySet: (negated) =>
    negated ? "Совсем любой символ" : "Ничего (пустой набор никогда не совпадает)",
  set: (list, negated) => (negated ? `Любой символ, кроме: ${list}` : `Один из: ${list}`),
  anchor: (kind, multiline) =>
    ({
      start: multiline ? "Начало строки" : "Начало текста",
      end: multiline ? "Конец строки" : "Конец текста",
      wordBoundary: "Граница слова (между словом и не-словом)",
      notWordBoundary: "Не граница слова",
    })[kind],
  backref: (reference) => `Тот же текст, что нашла группа ${reference}`,
  sequence: (empty) => (empty ? "Ничего (всегда совпадает с пустой строкой)" : "По порядку:"),
  alternation: (count) => `Один из ${count} вариантов:`,
  group: (index, name) =>
    index === null
      ? "Группа (не запоминается):"
      : `Запомнить как группу #${index}${name ? ` «${name}»` : ""}:`,
  look: (negated, behind) =>
    `Проверить, что ${behind ? "перед этим" : "дальше"} ${negated ? "нет" : "идёт"} (не забирая символы):`,
  repeat: (times) => `Повторить ${times}:`,
  station: {
    anyChar: "любой",
    classes: {
      digit: ["цифра", "не цифра"],
      word: ["буква/цифра", "не буква/цифра"],
      space: ["пробел", "не пробел"],
    },
    anchors: {
      start: "начало",
      end: "конец",
      wordBoundary: "граница",
      notWordBoundary: "не граница",
    },
    sameAs: (reference) => `как ${reference}`,
  },
  note: ({ min, max, lazy }) => {
    const base =
      max === Infinity
        ? min === 0
          ? "сколько угодно"
          : `${min}+ ${timesRu(min)}`
        : min === max
          ? `${min}×`
          : `${min}–${max} ${timesRu(max)}`;
    return lazy ? `${base} · лениво` : base;
  },
  frame: {
    group: "группа",
    look: (negated, behind) => `${behind ? "перед этим" : "дальше"} ${negated ? "нет" : "идёт"}`,
  },
  error: (detail) => {
    switch (detail.code) {
      case "trailingBackslash":
        return "Паттерн не может заканчиваться обратной косой чертой";
      case "unclosedSet":
        return "Этот набор символов не закрыт скобкой ]";
      case "rangeOrder":
        return `Диапазон ${detail.from}-${detail.to} задан в неправильном порядке`;
      case "badGroupName":
        return "Имя группы должно начинаться с буквы и состоять из букв, цифр или _";
      case "unknownGroup":
        return "Неизвестный тип группы после (?";
      case "unclosedGroup":
        return "Эта группа не закрыта скобкой )";
      case "missingGroup":
        return `Нет группы #${detail.group}, на которую можно сослаться`;
      case "missingName":
        return `Нет группы с именем «${detail.name}»`;
      case "nothingToRepeat":
        return `Перед «${detail.char}» нет ничего, что можно повторить`;
      case "quantifierOrder":
        return "Числа в {min,max} идут в неправильном порядке";
      case "cannotRepeat":
        return "Якоря и проверки «перед этим» нельзя повторять";
      case "doubleQuantifier":
        return "Квантификатор нельзя повторять сразу за другим";
      case "unmatchedParen":
        return "У этой скобки ) нет пары (";
      case "duplicateName":
        return `Имя группы «${detail.name}» использовано дважды`;
    }
  },
};

export const phrasesFor = (lang: "en" | "ru") => (lang === "ru" ? ru : en);
