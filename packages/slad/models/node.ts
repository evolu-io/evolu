/* eslint-env browser */
import { Brand } from 'utility-types';
import nanoid from 'nanoid';
import { IO } from 'fp-ts/lib/IO';
import { Refinement } from 'fp-ts/lib/function';
import { Option, none, fold, some } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { EditorPath, getLastIndex } from './path';

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

/**
 * Node and offset tuple for selection anchor and focus props.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export type NodeOffset = [Node, number];

export function createNodeOffset(
  path: EditorPath,
): (nodeOption: Option<Node>) => Option<NodeOffset> {
  return nodeOption =>
    pipe(
      nodeOption,
      fold(() => none, node => some([node, getLastIndex(path)])),
    );
}
