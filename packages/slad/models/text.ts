import invariant from 'tiny-invariant';
import { Predicate, Refinement } from 'fp-ts/lib/function';
import { EditorNode } from './node';

/**
 * EditorText is object because even the two identical texts need own identity.
 * Child index position is not enough for React key and CRDT.
 * Empty string is rendered as BR.
 */
export interface EditorText extends EditorNode {
  readonly text: string;
}

export const isEditorText: Refinement<EditorNode, EditorText> = (
  u,
): u is EditorText => typeof (u as EditorText).text === 'string';

export function invariantIsEditorText(value: EditorNode): value is EditorText {
  invariant(isEditorText(value), 'The value is not EditorText.');
  return true;
}

export const textIsBR: Predicate<string> = text => text.length === 0;

export function editorTextIsBR(editorText: EditorText) {
  return textIsBR(editorText.text);
}
