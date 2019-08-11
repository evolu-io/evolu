export type SladPath = readonly number[];

export const pathsAreEqual = (path1: SladPath, path2: SladPath): boolean => {
  if (path1 === path2) return true;
  const { length } = path1;
  if (length !== path2.length) return false;
  for (let i = 0; i < length; i++) if (path1[i] !== path2[i]) return false;
  return true;
};
