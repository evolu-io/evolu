import { createElement } from 'react';
import { Optional, Assign } from 'utility-types';
import { pipe } from 'fp-ts/lib/pipeable';
import { Endomorphism } from 'fp-ts/lib/function';
import { Option, none, toNullable, some } from 'fp-ts/lib/Option';
import {
  deleteContentElement,
  EditorElement,
  jsx,
  setTextElement,
  EditorReactElement,
} from './element';
import {
  collapseEditorSelectionToStart,
  EditorSelection,
  eqEditorSelection,
  moveEditorSelection,
} from './selection';

export interface EditorState {
  readonly element: EditorElement;
  readonly selection: Option<EditorSelection>;
  readonly hasFocus: boolean;
}

/**
 * Create editor state. By default, the root element is EditorReactElement.
 */
export function createEditorState<
  T extends EditorElement = EditorReactElement
>({
  element,
  selection = none,
  hasFocus = false,
}: Assign<
  Optional<EditorState, 'hasFocus' | 'selection'>,
  { element: T }
>): EditorState {
  return { element, selection, hasFocus };
}

export function createEditorStateWithText({
  text = '',
  selection = none,
  hasFocus = false,
}: {
  text?: string;
  selection?: Option<EditorSelection>;
  hasFocus?: boolean;
}) {
  return createEditorState({
    element: jsx(createElement('div', { className: 'root' }, text)),
    selection,
    hasFocus,
  });
}

export function select(selection: EditorSelection): Endomorphism<EditorState> {
  return state => {
    // TODO: Replace toNullable with something.
    const stateSelection = toNullable(state.selection);
    if (stateSelection && eqEditorSelection.equals(stateSelection, selection))
      return state;
    return { ...state, selection: some(selection) };
  };
}

export function setText(text: string): Endomorphism<EditorState> {
  return state => {
    // TODO: Replace toNullable with something.
    const selection = toNullable(state.selection);
    // https://github.com/gcanti/fp-ts/issues/973
    if (selection == null)
      throw new Error('Text can not be set without a selection.');
    return {
      ...state,
      element: setTextElement(text, selection)(state.element),
    };
  };
}

// TODO: It should traverse across nodes.
export function move(offset: number): Endomorphism<EditorState> {
  return state => {
    // How to do it without toNullable?
    const selection = toNullable(state.selection);
    if (selection == null)
      throw new Error('Selection must exists to be moved.');
    return pipe(
      state,
      select(
        pipe(
          selection,
          moveEditorSelection(offset),
        ),
      ),
    );
  };
}

export function deleteContent(
  selection?: EditorSelection,
): Endomorphism<EditorState> {
  return state => {
    const deleteContentSelection = selection || toNullable(state.selection);
    if (deleteContentSelection == null)
      throw new Error('Selection must exists for deletion.');
    return pipe(
      state,
      state => ({
        ...state,
        element: deleteContentElement(deleteContentSelection)(state.element),
      }),
      select(collapseEditorSelectionToStart(deleteContentSelection)),
    );
  };
}
