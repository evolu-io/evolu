import { Brand } from 'utility-types';
import nanoid from 'nanoid';

/**
 * EditorNodeID is string created with nanoid.
 * Every editor node needs UUID for CRDT and React keys.
 */
export type EditorNodeID = Brand<string, 'EditorNodeID'>;

export function id(): EditorNodeID {
  return nanoid() as EditorNodeID;
}

export interface EditorNode {
  id: EditorNodeID;
}
