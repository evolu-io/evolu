import { createElement } from 'react';
import { Optional, Assign } from 'utility-types';
import invariant from 'tiny-invariant';
import { pipe } from 'fp-ts/lib/pipeable';
import { Predicate, Endomorphism } from 'fp-ts/lib/function';
import {
  deleteContentElement,
  EditorElement,
  jsx,
  setTextElement,
  materializeEditorPath,
  EditorReactElement,
} from './element';
import {
  collapseEditorSelectionToStart,
  EditorSelection,
  eqEditorSelection,
  invariantEditorSelectionIsNotNull,
  moveEditorSelection,
} from './selection';

export interface EditorState {
  readonly element: EditorElement;
  readonly selection: EditorSelection | null;
  readonly hasFocus: boolean;
}

/**
 * Create editor state. By default, the root element is EditorReactElement.
 */
export function createEditorState<
  T extends EditorElement = EditorReactElement
>({
  element,
  selection = null,
  hasFocus = false,
}: Assign<
  Optional<EditorState, 'hasFocus' | 'selection'>,
  { element: T }
>): EditorState {
  return { element, selection, hasFocus };
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
    element: jsx(createElement('div', { className: 'root' }, text)),
    selection,
    hasFocus,
  });
}

// TODO: Refactor out to isEditorElementSelectionValid.
export const isEditorStateSelectionValid: Predicate<EditorState> = state => {
  if (!state.selection) return true;
  const anchorMaterializedPath = materializeEditorPath(state.selection.anchor)(
    state.element,
  );
  const focusMaterializedPath = materializeEditorPath(state.selection.focus)(
    state.element,
  );
  return anchorMaterializedPath != null && focusMaterializedPath != null;
};

export function invariantIsEditorStateSelectionValid(
  state: EditorState,
): boolean {
  invariant(
    isEditorStateSelectionValid(state),
    'EditorState selection does not match EditorState element. Wrong selection or wrong element.',
  );
  return true;
}

export function select(selection: EditorSelection): Endomorphism<EditorState> {
  return state => {
    if (state.selection && eqEditorSelection.equals(state.selection, selection))
      return state;
    const nextState = { ...state, selection };
    invariantIsEditorStateSelectionValid(nextState);
    return nextState;
  };
}

export function setText(text: string): Endomorphism<EditorState> {
  return state => {
    if (!invariantEditorSelectionIsNotNull(state.selection)) return state;
    //
    return {
      ...state,
      element: setTextElement(text, state.selection)(state.element),
    };
  };
}

export function move(offset: number): Endomorphism<EditorState> {
  return state => {
    if (!invariantEditorSelectionIsNotNull(state.selection)) return state;
    return select(moveEditorSelection(offset)(state.selection))(state);
  };
}

export function deleteContent(
  selection?: EditorSelection,
): Endomorphism<EditorState> {
  return state => {
    const deleteContentSelection = selection || state.selection;
    // Can't wait for TS 3.7 asserts.
    if (!invariantEditorSelectionIsNotNull(deleteContentSelection))
      return state;
    return pipe(
      state,
      state => {
        return {
          ...state,
          element: deleteContentElement(deleteContentSelection)(state.element),
        };
      },
      select(collapseEditorSelectionToStart(deleteContentSelection)),
    );
  };
}
