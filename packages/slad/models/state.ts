import { createElement } from 'react';
import { Optional } from 'utility-types';
import invariant from 'tiny-invariant';
import { pipe } from 'fp-ts/lib/pipeable';
import { Predicate } from 'fp-ts/lib/function';
import {
  deleteContentElement,
  EditorElement,
  EditorReactElement,
  jsx,
  setTextElement,
  materializeEditorPath,
} from './element';
import {
  collapseEditorSelectionToStart,
  EditorSelection,
  eqEditorSelection,
  invariantEditorSelectionIsNotNull,
  moveEditorSelection,
} from './selection';

// Maybe default should be EditorElement. Let's see.
export interface EditorState<T extends EditorElement = EditorReactElement> {
  readonly element: T;
  readonly selection: EditorSelection | null;
  readonly hasFocus: boolean;
}

export type PartialEditorState<
  T extends EditorElement = EditorElement
> = Partial<EditorState<T>>;

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
    element: jsx(createElement('div', { className: 'root' }, text)),
    selection,
    hasFocus,
  });
}

// TODO: Refactor out to isEditorElementSelectionValid.
export const isEditorStateSelectionValid: Predicate<
  EditorState<EditorElement>
> = state => {
  if (!state.selection) return true;
  const anchorMaterializedPath = materializeEditorPath(state.selection.anchor)(
    state.element,
  );
  const focusMaterializedPath = materializeEditorPath(state.selection.focus)(
    state.element,
  );
  return anchorMaterializedPath != null && focusMaterializedPath != null;
};

export function invariantIsEditorStateSelectionValid<T extends EditorElement>(
  state: EditorState<T>,
): boolean {
  invariant(
    isEditorStateSelectionValid(state),
    'EditorState selection does not match EditorState element. Wrong selection or wrong element.',
  );
  return true;
}

export function select(selection: EditorSelection): MapEditorState {
  return state => {
    if (state.selection && eqEditorSelection.equals(state.selection, selection))
      return state;
    const nextState = { ...state, selection };
    invariantIsEditorStateSelectionValid(nextState);
    return nextState;
  };
}

export function setText(text: string): MapEditorState {
  return state => {
    if (!invariantEditorSelectionIsNotNull(state.selection)) return state;
    //
    return {
      ...state,
      element: setTextElement(text, state.selection)(state.element),
    };
  };
}

export function move(offset: number): MapEditorState {
  return state => {
    if (!invariantEditorSelectionIsNotNull(state.selection)) return state;
    return select(moveEditorSelection(offset)(state.selection))(state);
  };
}

export function deleteContent(selection?: EditorSelection): MapEditorState {
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
