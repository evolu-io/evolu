import {
  normalizeEditorElement,
  EditorElement,
  isNormalizedEditorElement,
} from './element';

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
            children: ['a', { children: [] }, 'b', 'c'],
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
  ).toBe(true);
  expect(
    isNormalizedEditorElement({
      children: ['a', 'b'],
    }),
  ).toBe(false);
  expect(
    isNormalizedEditorElement({
      children: [{ children: [''] }],
    }),
  ).toBe(true);
});

test('normalizeEditorElement do not add children', () => {
  expect(normalizeEditorElement({ children: [] })).toMatchSnapshot();
});

test('normalizeEditorElement do not remove children', () => {
  expect(normalizeEditorElement({ children: [] })).toMatchSnapshot();
  expect(normalizeEditorElement({ children: [''] })).toMatchSnapshot();
  expect(normalizeEditorElement({ children: ['.'] })).toMatchSnapshot();
});
