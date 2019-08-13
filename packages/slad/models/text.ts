export function insertText(text: string, insertedText: string, index: number) {
  return text.slice(0, index) + insertedText + text.slice(index);
}
