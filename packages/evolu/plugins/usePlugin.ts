import { useLayoutEffect, useState, useRef } from 'react';
import { IO } from 'fp-ts/lib/IO';
import { EditorRef, EditorIO } from '../types';

export const usePlugin = (
  editorRef: EditorRef,
  config: {
    start: (editorIO: EditorIO) => void;
    layoutEffect?: (editorIO: EditorIO) => void | IO<void>;
  },
) => {
  const [start, setStart] = useState(false);
  const configRef = useRef(config);
  useLayoutEffect(() => {
    configRef.current = config;
  });
  useLayoutEffect(() => {
    if (start && editorRef.current) {
      configRef.current.start(editorRef.current);
      return;
    }
    setStart(true);
  }, [editorRef, start]);
  useLayoutEffect(() => {
    if (editorRef.current && configRef.current.layoutEffect)
      configRef.current.layoutEffect(editorRef.current);
  });
};
