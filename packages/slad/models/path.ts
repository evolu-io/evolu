import { Endomorphism, Predicate } from 'fp-ts/lib/function';
import { eqNumber } from 'fp-ts/lib/Eq';
import { getEq } from 'fp-ts/lib/Array';
import { Option } from 'fp-ts/lib/Option';

export type EditorPath = number[];

export type NodesEditorPathsMap = Map<Node, EditorPath>;

export type SetNodeEditorPath = (
  operation: 'add' | 'remove',
  node: Node,
  path: EditorPath,
) => void;
export type GetNodeByEditorPath = (editorPath: EditorPath) => Option<Node>;
export type GetEditorPathByNode = (node: Node) => Option<EditorPath>;

export const editorPathIsEmpty: Predicate<EditorPath> = path =>
  path.length === 0;

/**
 * Key is editorPath.join().
 */
export type EditorPathsNodesMap = Map<string, Node>;

export const eqEditorPath = getEq(eqNumber);

// TODO: Consider Option for getParentPath and getParentPathAndLastIndex.

/**
 * Example: `[0, 1, 2]` to `[0, 1]`.
 */
export function getParentPath(path: EditorPath): EditorPath {
  return path.slice(0, -1) as EditorPath;
}

/**
 * Example: `[0, 1, 2]` to `2`.
 */
export function getLastIndex(path: EditorPath): number {
  return path[path.length - 1];
}

/**
 * Example: `[0, 1, 2]` to `[[0, 1], 2]`.
 */
export function getParentPathAndLastIndex(
  path: EditorPath,
): [EditorPath, number] {
  return [getParentPath(path), getLastIndex(path)];
}

export function editorPathsAreForward(
  anchorPath: EditorPath,
  focusPath: EditorPath,
): boolean {
  return !anchorPath.some((value, index) => value > focusPath[index]);
}

export function movePath(offset: number): Endomorphism<EditorPath> {
  return path => {
    const [parentPath, lastIndex] = getParentPathAndLastIndex(path);
    return [...parentPath, lastIndex + offset] as EditorPath;
  };
}
