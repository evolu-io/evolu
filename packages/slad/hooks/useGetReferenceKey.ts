import { useCallback } from 'react';

let id = 0;

const weakMap = new WeakMap<object, string>();

/**
 * `useReferenceKey` will return a unique key representing object identity.
 * We use this for React key when we have no other object identity than reference.
 * We can not use structural identity, because it would produce non unique key.
 * We can not use SladPath, because it does not represent identity across
 * updates. It would be the same as using indexes for keys.
 * But we also can not reuse the same instance among siblings:
 * product.tags = [a, a, a, a]
 * But that's fine, because:
 * "Immer assumes your state to be a unidirectional tree. That is, no object should
 * appear twice in the tree, and there should be no circular references.""
 * https://github.com/immerjs/immer#pitfalls
 */
export const useGetReferenceKey = () => {
  const getReferenceKey = useCallback((object: object): string => {
    let key = weakMap.get(object);
    if (key !== undefined) return key;
    key = (id++).toString();
    weakMap.set(object, key);
    return key;
  }, []);

  return getReferenceKey;
};
