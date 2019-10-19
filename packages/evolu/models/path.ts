import { foldRight, getEq } from 'fp-ts/lib/Array';
import { eqNumber } from 'fp-ts/lib/Eq';
import { Endomorphism } from 'fp-ts/lib/function';
import { Option } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Newtype, iso } from 'newtype-ts';
import { Ord, fromCompare } from 'fp-ts/lib/Ord';

// neprejmenovat na Path?
//
export type EditorPath = number[];

export interface EditorPathString
  extends Newtype<{ readonly EditorPathString: unique symbol }, string> {}

const isoEditorPathString = iso<EditorPathString>();

export function editorPathToString(path: EditorPath): EditorPathString {
  return isoEditorPathString.wrap(path.join());
}

export function editorPathFromString(path: EditorPathString): EditorPath {
  return isoEditorPathString
    .unwrap(path)
    .split(',')
    .map(s => Number(s));
}

export type SetNodeEditorPath = (
  operation: 'add' | 'remove',
  node: Node,
  path: EditorPath,
) => void;
export type GetNodeByEditorPath = (editorPath: EditorPath) => Option<Node>;
export type GetEditorPathByNode = (node: Node) => Option<EditorPath>;

export const eqEditorPath = getEq(eqNumber);

export const byDirection: Ord<EditorPath> = fromCompare((x, y) =>
  eqEditorPath.equals(x, y)
    ? 0
    : !x.some((value, index) => value > y[index])
    ? 1
    : -1,
);

export function movePath(offset: number): Endomorphism<EditorPath> {
  return path =>
    pipe(
      path,
      foldRight(() => path, (init, last) => [...init, last + offset]),
    );
}
