import { Endomorphism, Refinement } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import { Lens } from 'monocle-ts';
import { createElement } from 'react';
import {
  deleteContentElement,
  Element,
  ReactElement,
  jsx,
  normalizeElement,
  setTextElement,
} from './element';
import {
  collapseSelectionToStart,
  Selection,
  eqSelection,
  moveSelection,
} from './selection';

/**
 * Use StateWithoutSelection everywhere where State must not have any selection.
 */
export interface StateWithoutSelection {
  readonly element: Element;
  readonly hasFocus: boolean;
}

/**
 * Use StateWithSelection everywhere where State must have a selection.
 */
export interface StateWithSelection {
  readonly element: Element;
  readonly hasFocus: boolean;
  readonly selection: Selection;
}

// State is sum type.
// https://github.com/gcanti/fp-ts/issues/973#issuecomment-542185502
// https://dev.to/gcanti/functional-design-algebraic-data-types-36kf
// https://www.youtube.com/watch?v=PLFl95c-IiU

/**
 * State for Editor.
 */
export type State = StateWithoutSelection | StateWithSelection;

export const isStateWithSelection: Refinement<State, StateWithSelection> = (
  value,
): value is StateWithSelection => {
  return (value as StateWithSelection).selection != null;
};

export function createState<T extends Element>({
  element,
  selection,
  hasFocus = false,
}: {
  element: T;
  selection?: Selection;
  hasFocus?: boolean;
}): State {
  return { element, selection, hasFocus };
}

export function createStateWithText(text = '') {
  return createState<ReactElement>({
    element: jsx(createElement('div', { className: 'root' }, text)),
    hasFocus: false,
  });
}

// Functional optics.
// https://github.com/gcanti/monocle-ts

/**
 * Focus on the element of State.
 */
export const elementLens = Lens.fromProp<State>()('element');

export function select(
  selection: Selection,
): (state: State) => StateWithSelection {
  return state => {
    if (
      isStateWithSelection(state) &&
      eqSelection.equals(state.selection, selection)
    )
      return state;
    return { ...state, selection };
  };
}

export function setText(text: string): Endomorphism<StateWithSelection> {
  return state => {
    return {
      ...state,
      element: setTextElement(text, state.selection)(state.element),
    };
  };
}

// TODO: It should traverse across nodes.
export function move(offset: number): Endomorphism<StateWithSelection> {
  return state => {
    return pipe(
      state,
      select(
        pipe(
          state.selection,
          moveSelection(offset),
        ),
      ),
    );
  };
}

export const deleteContent: Endomorphism<StateWithSelection> = state => {
  return pipe(
    state,
    state => ({
      ...state,
      element: deleteContentElement(state.selection)(state.element),
    }),
    select(collapseSelectionToStart(state.selection)),
  );
};

export const normalize: Endomorphism<State> = state => {
  // https://github.com/gcanti/fp-ts/issues/976
  const element = normalizeElement(state.element);
  if (element === state.element) return state;
  return { ...state, element };
};
