export const insertText = (text: string, index: number) =>
  text.slice(0, index) + text + text.slice(index);
