import invariant from 'tiny-invariant';
import { EditorNode } from './node';

/**
 * EditorText is object because even the two identical texts need own identity.
 * Child index position is not enough for React key and CRDT.
 * Empty string is rendered as BR.
 */
export interface EditorText extends EditorNode {
  readonly text: string;
}

export function isEditorText(node: EditorNode): node is EditorText {
  return (node as EditorText).text !== undefined;
}

export function editorTextIsBR(editorText: EditorText) {
  return editorText.text.length === 0;
}

export function invariantIsEditorText(node: EditorNode): node is EditorText {
  invariant(isEditorText(node), 'EditorNode is not EditorText.');
  return true;
}

export function editorTextsAreEqual(
  text1: EditorText,
  text2: EditorText,
): boolean {
  if (text1 === text2) return true;
  return text1.text === text2.text;
}

export function insertTextToString(
  text: string,
  insertedText: string,
  index: number,
) {
  return text.slice(0, index) + insertedText + text.slice(index);
}
