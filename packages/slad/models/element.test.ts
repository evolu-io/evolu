import { normalizeElement, Element } from './element';

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
