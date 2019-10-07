/* eslint-env browser */
import { Brand } from 'utility-types';
import nanoid from 'nanoid';
import { IO } from 'fp-ts/lib/IO';
import { Refinement } from 'fp-ts/lib/function';

/**
 * EditorNodeID is string created with nanoid.
 * Editor nodes need UUID for CRDT, React keys, and the other identity operations.
 */
export type EditorNodeID = Brand<string, 'EditorNodeID'>;

export interface EditorNode {
  readonly id: EditorNodeID;
}

export const id: IO<EditorNodeID> = () => nanoid() as EditorNodeID;

export const isTextNode: Refinement<Node, Text> = (node): node is Text =>
  (node as Text).nodeType === Node.TEXT_NODE;
