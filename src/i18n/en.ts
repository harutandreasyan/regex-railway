import type { FlagKey } from "../engine/flags";

export const en = {
  language: { switchTo: "RU", switchLabel: "RU: switch to Russian" },
  toolbar: {
    share: "Share",
    copied: "Copied",
    light: "Switch to light theme",
    dark: "Switch to dark theme",
  },
  intro: {
    before: "See how a regex ",
    highlight: "thinks",
    after: ".",
    lead: "A regex is a search rule that looks like gibberish. Here it becomes a metro map, and a train shows you, letter by letter, how it finds things in your text.",
  },
  step: (number: number) => `Step ${number}: `,
  steps: {
    pattern: {
      title: "Write a search rule",
      hint: "Not sure what to type? Tap one of the examples.",
    },
    text: { title: "Give it some text", hint: "The train searches this text." },
    watch: {
      title: "Watch the train",
      hint: "Every station is one part of your rule. Tap a station to see what it means.",
    },
    results: { title: "See what it found", hint: "Every match, and the rule in plain words." },
  },
  pattern: {
    label: "Pattern",
    flags: "Flags",
    hints: {
      global: "global: find every match, not just the first",
      ignoreCase: "ignore case: A and a are the same",
      multiline: "multiline: ^ and $ work on every line",
      dotAll: "dot all: . also matches line breaks",
    } satisfies Record<FlagKey, string>,
    at: (position: number) => `at position ${position}`,
  },
  examples: {
    label: "Try",
    names: {
      numbers: "Numbers",
      spelling: "Either spelling",
      email: "Email",
      date: "Date",
      hex: "Hex color",
      password: "Strong password",
      tag: "HTML tag",
      price: "Price",
      ip: "IP address",
      repeat: "Repeated word",
      trap: "Backtracking trap",
    } as Readonly<Record<string, string>>,
  },
  text: { label: "Test text" },
  views: { label: "Map style", line: "Line", map: "Full map" },
  map: {
    region: "Railway map, scrolls sideways when wide",
    image:
      "Railway map of the pattern. Each station is described in plain words in the Explain tab.",
    broken: "The line is closed for repairs. Fix the pattern above and the map comes back.",
  },
  line: {
    label: "The pattern as a line of stations, from top to bottom",
    start: "Start: the train reads the text from left to right",
    end: "Arrived: everything fits, that is a match",
    here: "The train is here",
    passed: "Passed",
  },
  watch: { play: "Watch the train", pause: "Pause", again: "Watch again", resume: "Keep going" },
  debugger: {
    region: "Step-by-step debugger",
    restart: "Back to the start",
    previous: "Previous step",
    next: "Next step",
    play: "Play",
    pause: "Pause",
    replay: "Replay",
    step: "Debugger step",
    stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
    truncated: (total: number) => `Only the first ${total} steps are recorded for replay`,
    speed: "Speed",
    slow: "Slow",
    normal: "Normal",
  },
  narrate: {
    waiting: "The train is waiting at the station. Press play to watch it read the text.",
    attempt: (position: number, char: string | null) =>
      `New attempt from position ${position}${char === null ? " (the very end)" : `, starting at ${char}`}.`,
    arrived: (value: string, start: number, end: number) =>
      `Arrived! Matched ${value} from position ${start} to ${end}.`,
    nothing: "nothing",
    branch: "That branch was a dead end, backing up to try the next option.",
    repeat: "Dead end ahead, backing up to try a different number of repeats.",
    station: "This station",
    holds: (what: string, ok: boolean) =>
      `${what}: ${ok ? "yes, it holds here." : "no, not here."}`,
    matched: (what: string, seen: string) => `${what}: matched ${seen}.`,
    found: (what: string, seen: string) => `${what}: found ${seen} instead.`,
    endOfText: "the end of the text",
  },
  status: {
    matches: (count: number): string => (count === 1 ? "match" : "matches"),
    steps: (count: number): string => (count === 1 ? "step" : "steps"),
    verified: "Same result as your browser’s RegExp",
    alarmTitle: "Catastrophic backtracking.",
    alarmBefore: (steps: string) => ` The train gave up after ${steps} tries. Nested repeats like `,
    alarmMiddle:
      " can try every possible split of the text, and the number of tries doubles with each extra character. On a real server this freezes everything, an attack called ReDoS. Here, dropping the outer ",
    alarmAfter: " fixes it.",
  },
  results: {
    label: "Results",
    matches: (count: number) => `Matches · ${count}`,
    explain: "Explain",
    fixToMatch: "Fix the pattern to see matches.",
    fixToExplain: "Fix the pattern to read its explanation.",
    none: "No matches. The train never reached the end of the line.",
    empty: "(empty)",
    notUsed: "not used",
    more: (count: number) => `…and ${count} more`,
  },
  legend: {
    title: "How to read the map",
    items: {
      literal: ["Exact text", "A white station: these characters must appear exactly."],
      class: ["A kind of character", "A colored station: any digit, any letter, any of a set…"],
      anchor: [
        "A position check",
        "A dashed station: start, end or a word edge. It reads no letters.",
      ],
      loop: ["Repeat", "A loop below: the train may go round and read it again."],
      skip: ["Optional", "A bypass above: the train may skip this part."],
      branch: ["Either / or", "Branching lines: the train tries the top one first."],
      group: ["Group", "A frame with a number: the part the pattern remembers."],
    } as Readonly<Record<string, readonly [string, string]>>,
    icons: { exact: "ab", kind: "digit", position: "start" },
    turns: "The train turns",
    tones: {
      ok: ["Green", "this station fits the letter"],
      fail: ["Red", "it does not fit here"],
      back: ["Amber", "dead end, backing up to try another way"],
    } as Readonly<Record<string, readonly [string, string]>>,
  },
  footer: {
    author: "Harut Andreasyan",
    before: "Built from scratch by ",
    after:
      ": its own parser, backtracking engine and layout, checked against the browser on every run.",
  },
};

export type Messages = typeof en;
