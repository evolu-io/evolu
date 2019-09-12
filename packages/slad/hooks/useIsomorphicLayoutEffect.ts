import { useEffect, useLayoutEffect } from 'react';

// https://medium.com/@alexandereardon/uselayouteffect-and-ssr-192986cdcf7a
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
