import { Endomorphism } from 'fp-ts/lib/function';
import {
  alt,
  exists,
  fold,
  fromNullable,
  getOrElse,
  map,
  none,
  Option,
  some,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Lens } from 'monocle-ts';
import { createElement } from 'react';
import { jsx, normalizeElement, setTextElement } from './element';
import { eqSelection, moveSelection } from './selection';
import { Element, Selection, Value, ReactElement } from '../types';

export const createValue = <T extends Element>({
  element,
  selection = none,
  hasFocus = false,
}: {
  element: T;
  selection?: Option<Selection>;
  hasFocus?: boolean;
}): Value => ({
  element,
  selection,
  hasFocus,
  info: {
    nodes: [],
    // text: '',
  },
});

export const createValueWithText = (text = '') =>
  createValue<ReactElement>({
    element: jsx(createElement('div', { className: 'root' }, text)),
    hasFocus: false,
  });

/**
 * Focus on the element of Value.
 */
export const elementLens = Lens.fromProp<Value>()('element');

export const normalize: Endomorphism<Value> = value => {
  // https://github.com/gcanti/fp-ts/issues/976
  const element = normalizeElement(value.element);
  if (element === value.element) return value;
  return { ...value, element };
};

export const select = (selection: Selection): Endomorphism<Value> => value =>
  pipe(
    value.selection,
    exists(s => eqSelection.equals(s, selection)),
  )
    ? value
    : { ...value, selection: some(selection) };

export const setText = (
  text: string,
  selection?: Selection,
): Endomorphism<Value> => value =>
  pipe(
    fromNullable(selection),
    alt(() => value.selection),
    // Simple pipe nesting is ok. We can always refactor it out.
    map(selection =>
      pipe(
        value,
        elementLens.modify(setTextElement(text, selection)),
      ),
    ),
    getOrElse(() => value),
  );

// TODO: It should traverse across nodes.
export const move = (offset: number): Endomorphism<Value> => value =>
  pipe(
    value.selection,
    map(moveSelection(offset)),
    fold(() => value, selection => select(selection)(value)),
  );

export const deleteContent = (
  selection: Selection,
): Endomorphism<Value> => value =>
  pipe(
    value,
    a => {
      // TODO:
      // eslint-disable-next-line no-console
      console.log(selection);
      return a;
    },
  );
