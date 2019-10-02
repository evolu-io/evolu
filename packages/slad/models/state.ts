import { createElement } from 'react';
import { Optional } from 'utility-types';
import {
  deleteContentElement,
  EditorElement,
  EditorReactElement,
  jsxToEditorReactElement,
  setTextElement,
  editorElementPoint,
} from './element';
import {
  collapseEditorSelectionToStart,
  EditorSelection,
  editorSelectionsAreEqual,
  invariantEditorSelectionIsDefined,
  moveEditorSelection,
} from './selection';

export interface EditorState<T extends EditorElement = EditorReactElement> {
  readonly element: T;
  readonly selection: EditorSelection | null;
  readonly hasFocus: boolean;
}

export type MapEditorState<T extends EditorElement = EditorElement> = (
  state: EditorState<T>,
) => EditorState<T>;

/**
 * Create editor state. By default, the root element is EditorReactElement.
 */
export function createEditorState<
  T extends EditorState<EditorElement> = EditorState
>({
  element,
  selection = null,
  hasFocus = false,
}: Optional<T, 'hasFocus' | 'selection'>): T {
  return { element, selection, hasFocus } as T;
}

export function createEditorStateWithText({
  text = '',
  selection = null,
  hasFocus = false,
}: {
  text?: string;
  selection?: EditorSelection | null;
  hasFocus?: boolean;
}) {
  return createEditorState({
    element: jsxToEditorReactElement(
      createElement('div', { className: 'root' }, text),
    ),
    selection,
    hasFocus,
  });
}

/**
 * Validates whether state selection points to EditorElementPoints.
 */
export function isEditorStateSelectionValid<T extends EditorElement>(
  state: EditorState<T>,
): boolean {
  if (!state.selection) return true;
  const anchorPoint = editorElementPoint(state.selection.anchor)(state.element);
  const focusPoint = editorElementPoint(state.selection.focus)(state.element);
  return anchorPoint != null && focusPoint != null;
}

export function editorStatesAreEqual<T extends EditorElement>(
  editorState1: EditorState<T> | null,
  editorState2: EditorState<T> | null,
): boolean {
  if (editorState1 === editorState2) return true;
  if (editorState1 == null || editorState2 == null) return false;
  return (
    editorState1.element === editorState2.element &&
    editorState1.hasFocus === editorState2.hasFocus &&
    editorSelectionsAreEqual(editorState1.selection, editorState2.selection)
  );
}

export function select(selection: EditorSelection): MapEditorState {
  return state => {
    return { ...state, selection };
  };
}

export function setText(text: string): MapEditorState {
  return state => {
    if (!invariantEditorSelectionIsDefined(state.selection)) return state;
    // nebo tady?
    return {
      ...state,
      element: setTextElement(text, state.selection)(state.element),
    };
  };
}

// export function insertText(text: string, optionalSelection?: EditorSelection) {
//   return produceEditorState(draft => {
//     const selection = optionalSelection || draft.selection;
//     if (!invariantEditorSelectionIsDefined(selection)) return;
//     if (editorSelectionIsCollapsed(selection)) {
//       const point = editorElementPoint(selection.anchor)(draft.element);
//       if (!invariantIsEditorElementPoint(point)) return;
//       if (!invariantIsEditorTextWithOffset(point.to)) return;
//       const { editorText, offset } = point.to as Draft<EditorTextWithOffset>;
//       editorText.text =
//         editorText.text.slice(0, offset) + text + editorText.text.slice(offset);
//       draft.selection = moveEditorSelection(text.length)(selection) as Draft<
//         EditorSelection
//       >;
//     } else {
//       // TODO: Insert text over selection.
//     }
//   });
// }

export function move(offset: number): MapEditorState {
  return state => {
    if (!invariantEditorSelectionIsDefined(state.selection)) return state;
    return {
      ...state,
      selection: moveEditorSelection(offset)(state.selection),
    };
  };
}

export function deleteContent(selection: EditorSelection): MapEditorState {
  return state => {
    return {
      ...state,
      element: deleteContentElement(selection)(state.element),
      selection: collapseEditorSelectionToStart(selection),
    };
  };
}
