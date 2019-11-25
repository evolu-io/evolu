import { Eq, eqBoolean, getStructEq } from 'fp-ts/lib/Eq';
import { Endomorphism } from 'fp-ts/lib/function';
import { getEq, none, Option, some } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Lens } from 'monocle-ts';
import { createElement } from 'react';
import { Element, ReactElement, Selection, SetTextArg, Value } from '../types';
import { eqElement, jsx, normalizeElement, setTextElement } from './element';
import { eqSelection } from './selection';

export const eqValue: Eq<Value> = getStructEq({
  element: eqElement,
  hasFocus: eqBoolean,
  selection: getEq(eqSelection),
});

export const createValue = <E extends Element>({
  element,
  selection = none,
  hasFocus = false,
}: {
  element: E;
  selection?: Option<Selection>;
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
  selection: some(selection),
});

export const setText = (arg: SetTextArg): Endomorphism<Value> => value =>
  pipe(
    value,
    elementLens.modify(setTextElement({ text: arg.text, path: arg.path })),
    value => ({ ...value, selection: some(arg.selection) }),
  );

// TODO: Rethink move, maybe we will use Either.
// export const move = (delta: PathDelta): Endomorphism<Value> => value =>
// pipe(
//     sequenceT(option)(pathIndex(delta), value.selection),
//     chain(([delta, selection]) => moveSelection(delta)(selection)),
//     fold(
//       () => value,
//       selection => ({ ...value, selection: some(selection) }),
//     ),
//   );

export const deleteContent = (
  selection: Selection,
): Endomorphism<Value> => value =>
  pipe(value, a => {
    // TODO:
    // eslint-disable-next-line no-console
    console.log(selection);
    return a;
  });
