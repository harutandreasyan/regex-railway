export type Variant = { pattern: string; flags: string; text: string };

export type Example = Variant & {
  id: string;
  name: string;
  ru?: Partial<Variant>;
};

export const examples: readonly Example[] = [
  {
    id: "numbers",
    name: "Numbers",
    pattern: String.raw`\d+`,
    flags: "g",
    text: "Train 42 leaves platform 7 at 9:15",
    ru: { text: "Поезд 42 уходит с платформы 7 в 9:15" },
  },
  {
    id: "spelling",
    name: "Either spelling",
    pattern: "colou?r",
    flags: "gi",
    text: "Color, colour or colr?",
    ru: { pattern: "[её]жик", text: "Ёжик, ежик или ожик?" },
  },
  {
    id: "email",
    name: "Email",
    pattern: String.raw`[\w.+-]+@[\w-]+\.[a-z]{2,}`,
    flags: "gi",
    text: "Write to anna.k@mail.com or support@railway.dev, but not to @nobody or bob@.com",
    ru: {
      text: "Пишите на anna.k@mail.com или support@railway.dev, но не на @nobody или bob@.com",
    },
  },
  {
    id: "date",
    name: "Date",
    pattern: String.raw`(?<year>\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>\d{2})`,
    flags: "g",
    text: "Departures: 2026-10-30, 2026-13-01 and 1999-12-31",
    ru: { text: "Отправления: 2026-10-30, 2026-13-01 и 1999-12-31" },
  },
  {
    id: "hex",
    name: "Hex color",
    pattern: String.raw`#(?:[0-9a-f]{3}){1,2}\b`,
    flags: "gi",
    text: "color: #fff; border: #1E90FF; broken: #12345",
    ru: { text: "цвет: #fff; рамка: #1E90FF; сломанный: #12345" },
  },
  {
    id: "password",
    name: "Strong password",
    pattern: String.raw`^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$`,
    flags: "gm",
    text: "hunter2\nCorrectHorse9\nPASSWORD123\nshort1A",
  },
  {
    id: "tag",
    name: "HTML tag",
    pattern: String.raw`<(\w+)[^>]*>(.*?)</\1>`,
    flags: "g",
    text: '<b>bold</b> <i class="x">tilt</i> <b>broken</i>',
  },
  {
    id: "price",
    name: "Price",
    pattern: String.raw`(?<=\$)\d+(?:\.\d{2})?`,
    flags: "g",
    text: "Tickets $12.50, snacks $3, tax 7.25",
    ru: { text: "Билеты $12.50, перекус $3, налог 7.25" },
  },
  {
    id: "ip",
    name: "IP address",
    pattern: String.raw`\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b`,
    flags: "g",
    text: "Servers: 192.168.0.1, 10.0.0.255 and 256.1.1.1",
    ru: { text: "Серверы: 192.168.0.1, 10.0.0.255 и 256.1.1.1" },
  },
  {
    id: "repeat",
    name: "Repeated word",
    pattern: String.raw`\b(\w+)\s+\1\b`,
    flags: "gi",
    text: "The the train left left on time",
    ru: { pattern: String.raw`(\S+)\s+\1(?=\s)`, text: "Поезд поезд ушёл ушёл вовремя" },
  },
  {
    id: "trap",
    name: "Backtracking trap",
    pattern: String.raw`^(a+)+$`,
    flags: "",
    text: "aaaaaaaaaaaaaaaaaaaaaaaaaaaa!",
  },
];

export const findExample = (id: string) => examples.find((example) => example.id === id);

export const variantOf = (example: Example, lang: "en" | "ru"): Variant => ({
  pattern: (lang === "ru" ? example.ru?.pattern : undefined) ?? example.pattern,
  flags: (lang === "ru" ? example.ru?.flags : undefined) ?? example.flags,
  text: (lang === "ru" ? example.ru?.text : undefined) ?? example.text,
});
