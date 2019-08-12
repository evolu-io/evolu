export function insertText(text: string, index: number) {
  return text.slice(0, index) + text + text.slice(index);
}
