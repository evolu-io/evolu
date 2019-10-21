import { createStableIDFactory } from '../../web/tests/integration/helpers';
import {
  deleteContentElement,
  Element,
  isNormalizedElement,
  materializePath,
  normalizeElement,
} from './element';

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

test('deleteContentElement', () => {
  const el = { id: id(), children: [{ id: id(), text: 'a' }] };
  expect(
    deleteContentElement({ start: [0, 0], end: [0, 1] })(el),
  ).toMatchSnapshot();
});

test('materializePath', () => {
  // <div><b>a</b></div>
  const text = { id: id(), text: 'a' };
  const b = { id: id(), children: [text] };
  const div = { id: id(), children: [b] };

  expect(materializePath([])(div)).toMatchSnapshot();
  expect(materializePath([0])(div)).toMatchSnapshot();
  expect(materializePath([0, 0])(div)).toMatchSnapshot();
  expect(materializePath([0, 0, 0])(div)).toMatchSnapshot();
  expect(materializePath([0, 0, 1])(div)).toMatchSnapshot();

  // Nulls.
  expect(materializePath([0, 0, 0, 0])(div)).toMatchSnapshot();
  expect(materializePath([1])(div)).toMatchSnapshot();
  expect(materializePath([0, 1])(div)).toMatchSnapshot();
  expect(materializePath([0, 0, 2])(div)).toMatchSnapshot();
});
