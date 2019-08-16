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
      const selection = doc.getSelection() || undefined;
      callback(selection);
    };
    doc.addEventListener('selectionchange', handleDocumentSelectionChange);
    return () => {
      doc.removeEventListener('selectionchange', handleDocumentSelectionChange);
    };
  }, [callback, ref]);
}
