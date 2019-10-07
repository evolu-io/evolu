import invariant from 'tiny-invariant';
import { Predicate } from 'fp-ts/lib/function';
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
  invariant(isEditorText(value), 'The value is not EditorText.');
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
    'The value is not EditorTextWithOffset.',
  );
  return true;
}

export const textIsBR: Predicate<string> = text => text.length === 0;

export function editorTextIsBR(editorText: EditorText) {
  return textIsBR(editorText.text);
}
