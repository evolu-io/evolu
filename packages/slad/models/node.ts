import { Brand } from 'utility-types';
import nanoid from 'nanoid';

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

export function id(): EditorNodeID {
  return nanoid() as EditorNodeID;
}
