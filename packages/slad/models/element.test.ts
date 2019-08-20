import {
  normalizeEditorElement,
  EditorElement,
  isNormalizedEditorElement,
} from './element';

test('normalizeEditorElement removes empty strings', () => {
  const element: EditorElement = {
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
  expect(normalizeEditorElement(element)).toMatchSnapshot();
});

test('normalizeEditorElement do not add children', () => {
  expect(normalizeEditorElement({})).toMatchSnapshot();
});

test('normalizeEditorElement do not remove children', () => {
  expect(normalizeEditorElement({ children: [] })).toMatchSnapshot();
  expect(normalizeEditorElement({ children: [''] })).toMatchSnapshot();
  expect(normalizeEditorElement({ children: ['.'] })).toMatchSnapshot();
});

test('normalizeEditorElement merges adjacent strings', () => {
  const element: EditorElement = {
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
  expect(normalizeEditorElement(element)).toMatchSnapshot();
});

test('isNormalizedEditorElement', () => {
  expect(
    isNormalizedEditorElement({
      children: ['a'],
    }),
  ).toBe(true);
  expect(
    isNormalizedEditorElement({
      children: [''],
    }),
  ).toBe(false);
  expect(
    isNormalizedEditorElement({
      children: ['a', 'b'],
    }),
  ).toBe(false);
  expect(
    isNormalizedEditorElement({
      children: [{ children: [''] }],
    }),
  ).toBe(false);
});
