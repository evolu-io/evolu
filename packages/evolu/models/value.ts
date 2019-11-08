import { Eq, eqBoolean, getStructEq } from 'fp-ts/lib/Eq';
import { Endomorphism } from 'fp-ts/lib/function';
import * as o from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Lens } from 'monocle-ts';
import { createElement } from 'react';
import { Element, ReactElement, Selection, Value } from '../types';
import { eqElement, jsx, normalizeElement, setTextElement } from './element';
import { eqSelection, moveSelection } from './selection';

export const eqValue: Eq<Value> = getStructEq({
  element: eqElement,
  hasFocus: eqBoolean,
  selection: o.getEq(eqSelection),
});

export const createValue = <T extends Element>({
  element,
  selection = o.none,
  hasFocus = false,
}: {
  element: T;
  selection?: o.Option<Selection>;
  hasFocus?: boolean;
}): Value => ({
  element,
  selection,
  hasFocus,
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

export const setFocus = (hasFocus: boolean): Endomorphism<Value> => value => ({
  ...value,
  hasFocus,
});

export const select = (selection: Selection): Endomorphism<Value> => value => ({
  ...value,
  selection: o.some(selection),
});

export const setText = (
  text: string,
  selection?: Selection,
): Endomorphism<Value> => value =>
  pipe(
    o.fromNullable(selection),
    o.alt(() => value.selection),
    o.map(selection =>
      pipe(
        value,
        elementLens.modify(setTextElement(text, selection)),
      ),
    ),
    o.getOrElse(() => value),
  );

// TODO: It should traverse across nodes.
export const move = (offset: number): Endomorphism<Value> => value =>
  pipe(
    value.selection,
    o.map(moveSelection(offset)),
    o.fold(() => value, selection => select(selection)(value)),
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
