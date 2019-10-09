import { Endomorphism } from 'fp-ts/lib/function';
import { eqNumber } from 'fp-ts/lib/Eq';
import { NonEmptyArray, getEq, last } from 'fp-ts/lib/NonEmptyArray';

// Consider newtype-ts NonNegativeInteger.
type EditorPathIndex = number;

export type EditorPath = NonEmptyArray<EditorPathIndex>;

export type NodesEditorPathsMap = Map<Node, EditorPath>;

/**
 * Key is editorPath.join().
 */
export type EditorPathsNodesMap = Map<string, Node>;

export const eqEditorPath = getEq(eqNumber);

/**
 * Example: `[0, 1, 2]` to `[0, 1]`.
 */
export function getParentPath(path: EditorPath): EditorPath {
  return path.slice(0, -1) as EditorPath;
}

/**
 * Example: `[0, 1, 2]` to `[[0, 1], 2]`.
 */
export function parentPathAndLastIndex(path: EditorPath): [EditorPath, number] {
  return [getParentPath(path), last(path)];
}

export function editorPathsAreForward(
  anchorPath: EditorPath,
  focusPath: EditorPath,
): boolean {
  return !anchorPath.some((value, index) => value > focusPath[index]);
}

export function movePath(offset: number): Endomorphism<EditorPath> {
  return path => {
    const [parentPath, lastIndex] = parentPathAndLastIndex(path);
    return [...parentPath, lastIndex + offset] as EditorPath;
  };
}
