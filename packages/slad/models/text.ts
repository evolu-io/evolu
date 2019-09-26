import invariant from 'tiny-invariant';
import { EditorNode, isEditorNode } from './node';

/**
 * EditorText is object because even the two identical texts need own identity.
 * Child index position is not enough for React key and CRDT.
 * Empty string is rendered as BR.
 */
export interface EditorText extends EditorNode {
  readonly text: string;
}

export function isEditorText(value: unknown): value is EditorText {
  return isEditorNode(value) && typeof (value as EditorText).text === 'string';
}

export function invariantIsEditorText(value: unknown): value is EditorText {
  invariant(isEditorText(value), 'Value is not EditorText.');
  return true;
}

export type EditorTextWithOffset = {
  readonly editorText: EditorText;
  readonly offset: number;
};

export function isEditorTextWithOffset(
  value: unknown,
): value is EditorTextWithOffset {
  return (
    value != null &&
    isEditorText((value as EditorTextWithOffset).editorText) &&
    typeof (value as EditorTextWithOffset).offset === 'number'
  );
}

export function invariantIsEditorTextWithOffset(
  value: unknown,
): value is EditorTextWithOffset {
  invariant(
    isEditorTextWithOffset(value),
    'Value is not EditorTextWithOffset.',
  );
  return true;
}

export function editorTextIsBR(editorText: EditorText) {
  return editorText.text.length === 0;
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
