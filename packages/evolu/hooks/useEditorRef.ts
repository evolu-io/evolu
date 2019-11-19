import { useRef } from 'react';
import { EditorIO, EditorRef } from '../types';

export const useEditorRef = (): EditorRef => {
  return useRef<EditorIO>(null);
};
