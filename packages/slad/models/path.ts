export type EditorPath = readonly number[];

export type NodesEditorPathsMap = Map<Node, EditorPath>;
export type EditorPathsNodesMap = Map<string, Node>;

export function editorPathsAreEqual(
  path1: EditorPath,
  path2: EditorPath,
): boolean {
  if (path1 === path2) return true;
  const { length } = path1;
  if (length !== path2.length) return false;
  for (let i = 0; i < length; i++) if (path1[i] !== path2[i]) return false;
  return true;
}
