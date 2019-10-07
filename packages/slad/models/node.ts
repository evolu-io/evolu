/* eslint-env browser */
import { Brand } from 'utility-types';
import nanoid from 'nanoid';
import { IO } from 'fp-ts/lib/IO';

/**
 * EditorNodeID is string created with nanoid.
 * Editor nodes need UUID for CRDT, React keys, and the other identity operations.
 */
export type EditorNodeID = Brand<string, 'EditorNodeID'>;

export interface EditorNode {
  readonly id: EditorNodeID;
}

export function isEditorNode(value: unknown): value is EditorNode {
  return value != null && typeof (value as EditorNode).id === 'string';
}

export const id: IO<EditorNodeID> = () => nanoid() as EditorNodeID;

export function isTextNode(node: Node): node is Text {
  return (node as Text).nodeType === Node.TEXT_NODE;
}
