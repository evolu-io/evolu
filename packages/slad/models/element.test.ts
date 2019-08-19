import { normalizeElement, Element, isNormalizedElement } from './element';

test('normalizeElement removes empty strings', () => {
  const element: Element = {
    children: [
      '',
      '.',
      {
        children: [
          '.',
          {
            children: [''],
          },
        ],
      },
      '',
      '.',
    ],
  };
  expect(normalizeElement(element)).toMatchSnapshot();
});

test('normalizeElement do not add children', () => {
  expect(normalizeElement({})).toMatchSnapshot();
});

test('normalizeElement do not remove children', () => {
  expect(normalizeElement({ children: [] })).toMatchSnapshot();
  expect(normalizeElement({ children: [''] })).toMatchSnapshot();
  expect(normalizeElement({ children: ['.'] })).toMatchSnapshot();
});

test('normalizeElement merges adjacent strings', () => {
  const element: Element = {
    children: [
      'a',
      'b',
      {
        children: [
          'a',
          'b',
          'c',
          {
            children: ['a', {}, 'b', 'c'],
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

test('isNormalizedElement', () => {
  expect(
    isNormalizedElement({
      children: ['a'],
    }),
  ).toBe(true);
  expect(
    isNormalizedElement({
      children: [''],
    }),
  ).toBe(false);
  expect(
    isNormalizedElement({
      children: ['a', 'b'],
    }),
  ).toBe(false);
  expect(
    isNormalizedElement({
      children: [{ children: [''] }],
    }),
  ).toBe(false);
});
