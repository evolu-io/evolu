// Export everything. No reason to hide anything.
export * from './components/Editor';
export * from './components/EditorClient';
export * from './components/EditorElementRenderer';
export * from './components/EditorServer';
export * from './components/EditorTextRenderer';
export * from './contexts/RenderEditorElementContext';
export * from './contexts/SetNodeEditorPathContext';
export * from './hooks/editor/useBeforeInput';
export * from './hooks/editor/useDebugNodesEditorPaths';
export * from './hooks/editor/useNodesEditorPathsMapping';
export * from './hooks/useInvariantEditorElementIsNormalized';
export * from './hooks/useLogEditorState';
export * from './hooks/usePrevious';
export * from './hooks/useReducerWithLogger';
export * from './hooks/useSetNodeEditorPathRef';
export * from './models/element';
export * from './models/node';
export * from './models/path';
export * from './models/selection';
export * from './models/state';
export * from './models/text';
export * from './reducers/editorReducer';

// fp-ts etc. will not be peer dependencies because we will tree shake it via ES6.
// We should provide helpers so fp-ts should be an implementation detail I suppose.

export { pipe } from 'fp-ts/lib/pipeable';
