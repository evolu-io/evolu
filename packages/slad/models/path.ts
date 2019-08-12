export type Path = readonly number[];

export const pathsAreEqual = (path1: Path, path2: Path): boolean => {
  if (path1 === path2) return true;
  const { length } = path1;
  if (length !== path2.length) return false;
  for (let i = 0; i < length; i++) if (path1[i] !== path2[i]) return false;
  return true;
};
