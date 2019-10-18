import { foldRight, getEq } from 'fp-ts/lib/Array';
import { eqNumber } from 'fp-ts/lib/Eq';
import { Endomorphism } from 'fp-ts/lib/function';
import { Option } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';

// TODO: Add newtype NonNegativeInteger EditorPath. Consider RootEditorPath | ChildEditorPath.
export type EditorPath = number[];

export type SetNodeEditorPath = (
  operation: 'add' | 'remove',
  node: Node,
  path: EditorPath,
) => void;
export type GetNodeByEditorPath = (editorPath: EditorPath) => Option<Node>;
export type GetEditorPathByNode = (node: Node) => Option<EditorPath>;

export const eqEditorPath = getEq(eqNumber);

export function editorPathsAreForward(
  anchorPath: EditorPath,
  focusPath: EditorPath,
): boolean {
  return !anchorPath.some((value, index) => value > focusPath[index]);
}

export function movePath(offset: number): Endomorphism<EditorPath> {
  return path =>
    pipe(
      path,
      foldRight(() => path, (init, last) => [...init, last + offset]),
    );
}
