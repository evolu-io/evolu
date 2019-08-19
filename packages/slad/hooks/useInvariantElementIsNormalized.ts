import { useEffect } from 'react';
import invariant from 'tiny-invariant';
import { Element, isNormalizedElement } from '../models/element';

export function useInvariantElementIsNormalized(element: Element) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      invariant(
        isNormalizedElement(element),
        'Element is not normalized. It means it contains empty or adjacent strings.' +
          'You can use normalizeElement to fix it.',
      );
    }, [element]);
  }
}
