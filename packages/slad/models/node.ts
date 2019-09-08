import { Brand } from 'utility-types';
import nanoid from 'nanoid';

/**
 * EditorNodeID is string created with nanoid to ensure uniqueness.
 */
export type EditorNodeID = Brand<string, 'EditorNodeID'>;

// TODO: This factory should be internal.
// Recursive ensureEditorNodeID function should be prefered instead.
// But we have to wait for TS 3.7, which will allow RecursiveOptionalID type.
export function id(): EditorNodeID {
  return nanoid() as EditorNodeID;
}

/**
 * Every editor node needs UUID for CRDT and React keys.
 */
export interface EditorNodeIdentity {
  id: EditorNodeID;
}
