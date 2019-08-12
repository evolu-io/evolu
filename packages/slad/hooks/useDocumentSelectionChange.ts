import { RefObject, useEffect } from 'react';

export function useDocumentSelectionChange(
  ref: RefObject<Element>,
  callback: (selection: Selection | undefined) => void,
) {
  // Note we can not naively use useLayoutEffect because of SSR.
  // https://gist.github.com/gaearon/e7d97cdf38a2907924ea12e4ebdf3c85
  useEffect(() => {
    const doc = ref.current && ref.current.ownerDocument;
    if (doc == null) return;
    const handleDocumentSelectionChange = () => {
      callback(
        (doc.defaultView && doc.defaultView.getSelection()) || undefined,
      );
    };
    // Hmm, should we use useSubscription for future concurrent mode?
    // https://github.com/facebook/react/issues/16350
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [callback, ref]);
}
