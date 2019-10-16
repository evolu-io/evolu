import { Endomorphism, Refinement } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import { Lens } from 'monocle-ts';
import { createElement } from 'react';
import {
  deleteContentElement,
  EditorElement,
  EditorReactElement,
  jsx,
  normalizeEditorElement,
  setTextElement,
} from './element';
import {
  collapseEditorSelectionToStart,
  EditorSelection,
  eqEditorSelection,
  moveEditorSelection,
} from './selection';

export interface EditorStateWithoutSelection {
  readonly element: EditorElement;
  readonly hasFocus: boolean;
}

export interface EditorStateWithSelection {
  readonly element: EditorElement;
  readonly hasFocus: boolean;
  readonly selection: EditorSelection;
}

// EditorState is sum type.
// https://github.com/gcanti/fp-ts/issues/973#issuecomment-542185502
// https://dev.to/gcanti/functional-design-algebraic-data-types-36kf
// https://www.youtube.com/watch?v=PLFl95c-IiU
export type EditorState =
  | EditorStateWithoutSelection
  | EditorStateWithSelection;

export const isEditorStateWithSelection: Refinement<
  EditorState,
  EditorStateWithSelection
> = (value): value is EditorStateWithSelection => {
  return (value as EditorStateWithSelection).selection != null;
};

export function createEditorState<T extends EditorElement>({
  element,
  selection,
  hasFocus = false,
}: {
  element: T;
  selection?: EditorSelection;
  hasFocus?: boolean;
}): EditorState {
  return { element, selection, hasFocus };
}

export function createEditorStateWithText(text = '') {
  return createEditorState<EditorReactElement>({
    element: jsx(createElement('div', { className: 'root' }, text)),
    hasFocus: false,
  });
}

// Functional optics.
// https://github.com/gcanti/monocle-ts

/**
 * Focus on the element of EditorState.
 */
export const elementLens = Lens.fromProp<EditorState>()('element');

export function select(
  selection: EditorSelection,
): (state: EditorState) => EditorStateWithSelection {
  return state => {
    if (
      isEditorStateWithSelection(state) &&
      eqEditorSelection.equals(state.selection, selection)
    )
      return state;
    return { ...state, selection };
  };
}

export function setText(text: string): Endomorphism<EditorStateWithSelection> {
  return state => {
    return {
      ...state,
      element: setTextElement(text, state.selection)(state.element),
    };
  };
}

// TODO: It should traverse across nodes.
export function move(offset: number): Endomorphism<EditorStateWithSelection> {
  return state => {
    return pipe(
      state,
      select(
        pipe(
          state.selection,
          moveEditorSelection(offset),
        ),
      ),
    );
  };
}

export const deleteContent: Endomorphism<EditorStateWithSelection> = state => {
  return pipe(
    state,
    state => ({
      ...state,
      element: deleteContentElement(state.selection)(state.element),
    }),
    select(collapseEditorSelectionToStart(state.selection)),
  );
};

export const normalize: Endomorphism<EditorState> = state => {
  // https://github.com/gcanti/fp-ts/issues/976
  const element = normalizeEditorElement(state.element);
  if (element === state.element) return state;
  return { ...state, element };
};
