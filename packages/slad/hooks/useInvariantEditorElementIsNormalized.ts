import { useEffect } from 'react';
import invariant from 'tiny-invariant';
import { EditorElement, editorElementIsNormalized } from '../models/element';

export function useInvariantEditorElementIsNormalized(element: EditorElement) {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      invariant(
        editorElementIsNormalized(element),
        'EditorElement is not normalized. It means it contains adjacent strings.' +
          'You can use normalizeEditorElement to fix it.',
      );
    }, [element]);
  }
}
