import {
  normalizeEditorElement,
  EditorElement,
  isNormalizedEditorElement,
} from './element';

test('normalizeEditorElement merges adjacent strings', () => {
  const element: EditorElement = {
    children: [
      { text: 'a' },
      { text: 'b' },
      {
        children: [
          { text: 'a' },
          { text: 'b' },
          { text: 'c' },
          {
            children: [
              { text: 'a' },
              { children: [] },
              { text: 'b' },
              { text: 'c' },
            ],
          },
        ],
      },
      { text: 'a' },
      { text: '' },
      { text: 'b' },
    ],
  };
  expect(normalizeEditorElement(element)).toMatchSnapshot();
});

test('isNormalizedEditorElement', () => {
  expect(
    isNormalizedEditorElement({
      children: [{ text: 'a' }],
    }),
  ).toBe(true);
  expect(
    isNormalizedEditorElement({
      children: [{ text: '' }],
    }),
  ).toBe(true);
  expect(
    isNormalizedEditorElement({
      children: [{ text: 'a' }, { text: 'b' }],
    }),
  ).toBe(false);
  expect(
    isNormalizedEditorElement({
      children: [{ children: [{ text: '' }] }],
    }),
  ).toBe(true);
});

test('normalizeEditorElement do not add children', () => {
  expect(normalizeEditorElement({ children: [] })).toMatchSnapshot();
});

test('normalizeEditorElement do not remove children', () => {
  expect(normalizeEditorElement({ children: [] })).toMatchSnapshot();
  expect(
    normalizeEditorElement({ children: [{ text: '' }] }),
  ).toMatchSnapshot();
  expect(
    normalizeEditorElement({ children: [{ text: '.' }] }),
  ).toMatchSnapshot();
});
