import 'setimmediate';
import { setAutoFreeze } from 'immer';

// https://github.com/immerjs/immer/issues/430
setAutoFreeze(false);

// Export everything. Rethink before the release.
export * from './components/Editor';
export * from './components/EditorClient';
export * from './components/EditorElementRenderer';
export * from './components/EditorServer';
export * from './components/EditorTextRenderer';
export * from './contexts/RenderEditorElementContext';
export * from './contexts/SetNodeEditorPathContext';
export * from './hooks/editor/useBeforeInput';
export * from './hooks/editor/useDebugNodesEditorPaths';
export * from './hooks/editor/useNodesEditorPaths';
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
export * from './utils/pipe';
