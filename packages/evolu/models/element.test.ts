import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Option';
import { constVoid } from 'fp-ts/lib/function';
import { createStableIDFactory } from '../../web/tests/integration/helpers';
import {
  isNormalizedElement,
  normalizeElement,
  childrenLens,
  getChildAt,
  eqElement,
} from './element';
import { Element } from '../types';
import { toPathIndex } from './path';

const id = createStableIDFactory();

test('normalizeElement merges adjacent texts', () => {
  const element: Element = {
    id: id(),
    children: [
      'a',
      'b',
      {
        id: id(),
        children: [
          'a',
          'b',
          'c',
          {
            id: id(),
            children: ['a', { id: id(), children: [] }, 'b', 'c'],
          },
        ],
      },
      'a',
      '',
      'b',
    ],
  };
  expect(normalizeElement(element)).toMatchSnapshot();
});

test('normalizeElement preserves identity', () => {
  const element1: Element = {
    id: id(),
    children: [],
  };
  expect(normalizeElement(element1)).toBe(element1);

  const element2: Element = {
    id: id(),
    children: [{ id: id(), children: [] }, 'a'],
  };
  expect(normalizeElement(element2)).toBe(element2);

  const preservedChild = { id: id(), children: [] };
  const element3: Element = {
    id: id(),
    children: [preservedChild, 'a', 'b'],
  };
  const normalizedElement3 = normalizeElement(element3);
  expect(normalizedElement3).not.toBe(element3);
  expect(normalizedElement3.children[0]).toBe(preservedChild);
});

test('isNormalizedElement', () => {
  expect(
    isNormalizedElement({
      id: id(),
      children: ['a'],
    }),
  ).toBe(true);

  // Empty string is BR, that's ok.
  expect(
    isNormalizedElement({
      id: id(),
      children: [''],
    }),
  ).toBe(true);

  // Two not empty string, that's not ok.
  expect(
    isNormalizedElement({
      id: id(),
      children: ['a', 'b'],
    }),
  ).toBe(false);

  // Recursion works.
  expect(
    isNormalizedElement({
      id: id(),
      children: [{ id: id(), children: [''] }],
    }),
  ).toBe(true);

  // Empty string is BR, so it's ok.
  expect(
    isNormalizedElement({
      id: id(),
      children: ['a', '', 'a'],
    }),
  ).toBe(true);
});

test('normalizeElement do not add children', () => {
  expect(normalizeElement({ id: id(), children: [] })).toMatchSnapshot();
});

test('normalizeElement do not remove children', () => {
  expect(normalizeElement({ id: id(), children: [] })).toMatchSnapshot();
  expect(normalizeElement({ id: id(), children: [''] })).toMatchSnapshot();
  expect(normalizeElement({ id: id(), children: ['.'] })).toMatchSnapshot();
});

// It does not make sense to test simple functional optics,
// but it's helpful to understand how they work.

test('childrenLens', () => {
  const children: Element['children'] = [];
  const element: Element = { id: id(), children };
  expect(childrenLens.get(element)).toBe(children);
  expect(childrenLens.modify(a => a)(element)).toBe(element);
  const newChildren: Element['children'] = [];
  expect(childrenLens.modify(() => newChildren)(element).children).toBe(
    newChildren,
  );
});

test('getChildAt', () => {
  const child: Element = { id: id(), children: [] };
  const children: Element['children'] = [{ id: id(), children: [] }];
  pipe(
    toPathIndex(0),
    fold(constVoid, index => {
      expect(getChildAt(index).set(child)(children)[0]).toBe(child);
    }),
  );
});

test('eqElement', () => {
  const someId = id();
  const el1: Element = { id: someId, children: [] };
  const el2: Element = { id: someId, children: [] };
  expect(eqElement.equals(el1, el1)).toBe(true);
  expect(eqElement.equals(el1, el2)).toBe(true);
  el2.children.push(el1);
  expect(eqElement.equals(el1, el2)).toBe(false);
});

// eslint-disable-next-line jest/no-commented-out-tests
// test('elementPrism', () => {
//   const el1: Element = { id: id(), children: [] };
//   const text1: Text = 'a';
//   const newId = id();
//   // Prism is like filter.
//   expect(
//     elementPrism.modify(el => {
//       return { ...el, id: newId };
//     })(el1).id,
//   ).toBe(newId);
//   expect(
//     elementPrism.modify(el => {
//       return { ...el, id: newId };
//     })(text1).id,
//   ).not.toBe(newId);
// });

// eslint-disable-next-line jest/no-commented-out-tests
// test('getElementTraversal', () => {
//   const el: Element = {
//     id: id(),
//     children: [
//       {
//         id: id(),
//         children: [{ id: id(), children: [] }],
//       },
//     ],
//   };
//   const child: Element = { id: id(), children: [] };
//   expect(
//     getElementTraversal([0, 0]).modify(el => {
//       return { ...el, children: [child] };
//       // @ts-ignore
//     })(el).children[0].children[0].children[0],
//   ).toBe(child);
// });
