import { RefObject, useEffect } from 'react';

export function useDocumentSelectionChange(
  // We need ref to get ownerDocument conditionally.
  ref: RefObject<Element>,
  callback: (selection: Selection | undefined) => void,
) {
  useEffect(() => {
    const doc = ref.current && ref.current.ownerDocument;
    if (doc == null) return;
    const handleDocumentSelectionChange = () => {
      callback(
        (doc.defaultView && doc.defaultView.getSelection()) || undefined,
      );
    };
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [callback, ref]);
}
