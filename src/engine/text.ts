export const codeUnits = (value: string) =>
  Array.from({ length: value.length }, (_, index) => value.charAt(index));
