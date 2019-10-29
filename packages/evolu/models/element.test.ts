import { createStableIDFactory } from '../../web/tests/integration/helpers';
import {
  isNormalizedElement,
  normalizeElement,
  childrenLens,
  getChildAt,
  elementPrism,
} from './element';
import { Element, Text } from '../types';

const id = createStableIDFactory();

test('normalizeElement merges adjacent texts', () => {
  const element: Element = {
    id: id(),
    children: [
      { id: id(), text: 'a' },
      { id: id(), text: 'b' },
      {
        id: id(),
        children: [
          { id: id(), text: 'a' },
          { id: id(), text: 'b' },
          { id: id(), text: 'c' },
          {
            id: id(),
            children: [
              { id: id(), text: 'a' },
              { id: id(), children: [] },
              { id: id(), text: 'b' },
              { id: id(), text: 'c' },
            ],
          },
        ],
      },
      { id: id(), text: 'a' },
      { id: id(), text: '' },
      { id: id(), text: 'b' },
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
    children: [{ id: id(), children: [] }, { id: id(), text: 'a' }],
  };
  expect(normalizeElement(element2)).toBe(element2);

  const preservedChild = { id: id(), children: [] };
  const element3: Element = {
    id: id(),
    children: [
      preservedChild,
      { id: id(), text: 'a' },
      { id: id(), text: 'b' },
    ],
  };
  const normalizedElement3 = normalizeElement(element3);
  expect(normalizedElement3).not.toBe(element3);
  expect(normalizedElement3.children[0]).toBe(preservedChild);
});

test('isNormalizedElement', () => {
  expect(
    isNormalizedElement({
      id: id(),
      children: [{ id: id(), text: 'a' }],
    }),
  ).toBe(true);

  // Empty string is BR, that's ok.
  expect(
    isNormalizedElement({
      id: id(),
      children: [{ id: id(), text: '' }],
    }),
  ).toBe(true);

  // Two not empty string, that's not ok.
  expect(
    isNormalizedElement({
      id: id(),
      children: [{ id: id(), text: 'a' }, { id: id(), text: 'b' }],
    }),
  ).toBe(false);

  // Recursion works.
  expect(
    isNormalizedElement({
      id: id(),
      children: [{ id: id(), children: [{ id: id(), text: '' }] }],
    }),
  ).toBe(true);

  // Empty string is BR, so it's ok.
  expect(
    isNormalizedElement({
      id: id(),
      children: [
        { id: id(), text: 'a' },
        { id: id(), text: '' },
        { id: id(), text: 'a' },
      ],
    }),
  ).toBe(true);
});

test('normalizeElement do not add children', () => {
  expect(normalizeElement({ id: id(), children: [] })).toMatchSnapshot();
});

test('normalizeElement do not remove children', () => {
  expect(normalizeElement({ id: id(), children: [] })).toMatchSnapshot();
  expect(
    normalizeElement({ id: id(), children: [{ id: id(), text: '' }] }),
  ).toMatchSnapshot();
  expect(
    normalizeElement({ id: id(), children: [{ id: id(), text: '.' }] }),
  ).toMatchSnapshot();
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
  expect(getChildAt(0).set(child)(children)[0]).toBe(child);
});

test('elementPrism', () => {
  const el1: Element = { id: id(), children: [] };
  const text1: Text = { id: id(), text: 'a' };
  const newId = id();
  // Prism is like filter.
  expect(
    elementPrism.modify(el => {
      return { ...el, id: newId };
    })(el1).id,
  ).toBe(newId);
  expect(
    elementPrism.modify(el => {
      return { ...el, id: newId };
    })(text1).id,
  ).not.toBe(newId);
});

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
