import { EditorProps } from 'slad';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultEditorProps: Partial<EditorProps<any>> = {
  autoCorrect: 'off', // Disable browser autoCorrect.
  spellCheck: false, // Disable browser spellCheck.
  // @ts-ignore Force custom HTML data attribute.
  'data-gramm': true, // Disable Grammarly Chrome extension.
  style: {
    width: 300,
    marginBottom: 24,
    outline: 'none',
    padding: 8,
    backgroundColor: '#eee',
  },
};
