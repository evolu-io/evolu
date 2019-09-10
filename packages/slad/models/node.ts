import { Brand } from 'utility-types';
import nanoid from 'nanoid';

/**
 * EditorNodeID is string created with nanoid.
 */
export type EditorNodeID = Brand<string, 'EditorNodeID'>;

export function id(): EditorNodeID {
  return nanoid() as EditorNodeID;
}

/**
 * Every editor node needs UUID for CRDT and React keys.
 */
export interface EditorNodeIdentity {
  id: EditorNodeID;
}
