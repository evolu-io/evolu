import { EditorNodeIdentity } from './node';

/**
 * EditorText is object because even the two identical texts need own identity.
 * Child index position is not enough for React key and CRDT.
 * Empty string is rendered as BR.
 */
export interface EditorText extends EditorNodeIdentity {
  text: string;
}

export function editorTextsAreEqual(
  text1: EditorText,
  text2: EditorText,
): boolean {
  if (text1 === text2) return true;
  return text1.text === text2.text;
}

export function insertText(text: string, insertedText: string, index: number) {
  return text.slice(0, index) + insertedText + text.slice(index);
}
