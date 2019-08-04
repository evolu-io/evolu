import { useCallback } from 'react';

let id = 0;

const weakMap = new WeakMap<object, string>();

/**
 * `useReferenceKey` will return a unique key representing object identity.
 * We use this for React key when we have no other object identity than reference.
 * We can not use structural identity, because it would produce non unique key.
 */
export const useReferenceKey = () => {
  const getReferenceKey = useCallback((object: object): string => {
    let key = weakMap.get(object);
    if (key !== undefined) return key;
    id += 1;
    key = id.toString();
    weakMap.set(object, key);
    return key;
  }, []);

  return getReferenceKey;
};
