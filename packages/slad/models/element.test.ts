import {
  normalizeEditorElement,
  EditorElement,
  editorElementIsNormalized,
} from './element';
import { EditorNodeID } from './node';

// TODO: Stable EditorNodeID per test. PR anyone?
let lastID = 0;
// Stable EditorNodeID factory for test snapshots.
function id(): EditorNodeID {
  return (lastID++).toString() as EditorNodeID;
}

test('normalizeEditorElement merges adjacent strings', () => {
  const element: EditorElement = {
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
  expect(normalizeEditorElement(element)).toMatchSnapshot();
});

test('editorElementIsNormalized', () => {
  expect(
    editorElementIsNormalized({
      id: id(),
      children: [{ id: id(), text: 'a' }],
    }),
  ).toBe(true);

  // Empty string is BR, that's ok.
  expect(
    editorElementIsNormalized({
      id: id(),
      children: [{ id: id(), text: '' }],
    }),
  ).toBe(true);

  // Two not empty string, that's not ok.
  expect(
    editorElementIsNormalized({
      id: id(),
      children: [{ id: id(), text: 'a' }, { id: id(), text: 'b' }],
    }),
  ).toBe(false);

  // Recursion works.
  expect(
    editorElementIsNormalized({
      id: id(),
      children: [{ id: id(), children: [{ id: id(), text: '' }] }],
    }),
  ).toBe(true);

  // Empty string is BR, so it's ok.
  expect(
    editorElementIsNormalized({
      id: id(),
      children: [
        { id: id(), text: 'a' },
        { id: id(), text: '' },
        { id: id(), text: 'a' },
      ],
    }),
  ).toBe(true);
});

test('normalizeEditorElement do not add children', () => {
  expect(normalizeEditorElement({ id: id(), children: [] })).toMatchSnapshot();
});

test('normalizeEditorElement do not remove children', () => {
  expect(normalizeEditorElement({ id: id(), children: [] })).toMatchSnapshot();
  expect(
    normalizeEditorElement({ id: id(), children: [{ id: id(), text: '' }] }),
  ).toMatchSnapshot();
  expect(
    normalizeEditorElement({ id: id(), children: [{ id: id(), text: '.' }] }),
  ).toMatchSnapshot();
});
