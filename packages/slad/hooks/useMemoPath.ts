import { useRef } from 'react';
import { SladPath } from '../components/SladEditorSetNodePathContext';
import { pathsAreEqual } from '../functions/path';

// Like shouldComponentUpdate but better. Granularity ftw.
export const useMemoPath = (path: SladPath): SladPath => {
  const previousPathRef = useRef<SladPath | null>(null);
  if (previousPathRef.current && pathsAreEqual(previousPathRef.current, path))
    return previousPathRef.current;
  previousPathRef.current = path;
  return path;
};
