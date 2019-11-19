import { useRef, useEffect } from 'react';

// TODO: Use Option.
// https://reactjs.org/docs/hooks-faq.html#how-to-get-the-previous-props-or-state
export const usePrevious = <A>(value: A): A | undefined => {
  const ref = useRef<A>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};
