/* eslint-env browser */
import nanoid from 'nanoid';
import { IO } from 'fp-ts/lib/IO';
import { Refinement } from 'fp-ts/lib/function';
import { Option, none, fold, some } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Newtype, iso } from 'newtype-ts';
import { EditorPath } from './path';

/**
 * EditorNodeID is string created with nanoid.
 */
export interface EditorNodeID
  extends Newtype<{ readonly EditorNodeID: unique symbol }, string> {}

const isoEditorNodeID = iso<EditorNodeID>();

export function editorNodeIDToString(editorNodeID: EditorNodeID): string {
  return isoEditorNodeID.unwrap(editorNodeID);
}

export interface EditorNode {
  readonly id: EditorNodeID;
}

export type SetNodeEditorPathRef = (node: Node | null) => void;

export const id: IO<EditorNodeID> = () => isoEditorNodeID.wrap(nanoid());

export const isTextNode: Refinement<Node, Text> = (node): node is Text => {
  return node.nodeType === Node.TEXT_NODE;
};

export const isHTMLElement: Refinement<Node, HTMLElement> = (
  node,
): node is HTMLElement => {
  return node.nodeType === Node.ELEMENT_NODE;
};

/**
 * Node and offset tuple for selection anchor and focus props.
 * https://developer.mozilla.org/en-US/docs/Web/API/Selection
 */
export type NodeOffset = [Node, number];

export function createNodeOffset(
  path: EditorPath,
): (node: Option<Node>) => Option<NodeOffset> {
  return node =>
    pipe(
      node,
      // TODO: Use last.
      fold(() => none, node => some([node, path[path.length - 1]])),
    );
}
