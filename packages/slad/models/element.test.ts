import {
  normalizeEditorElement,
  EditorElement,
  editorElementIsNormalized,
  deleteContentElement,
  materializeEditorPath,
} from './element';
import { EditorNodeID } from './node';

// TODO: Use JSX <element><text>a<text></element> syntax for tests and snapshots.
// Need to investigate how to run React JSX in Jest tests.
// We can add .tsx, but there is some transpilation error.
// Then, we can have stable IDs and nice syntax.
// PR anyone?
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

test('deleteContentElement', () => {
  const el = { id: id(), children: [{ id: id(), text: 'a' }] };
  expect(
    deleteContentElement({ anchor: [0, 0], focus: [0, 1] })(el),
  ).toMatchSnapshot();
});

test('materializeEditorPath', () => {
  // <div><b>a</b></div>
  const text = { id: id(), text: 'a' };
  const b = { id: id(), children: [text] };
  const div = { id: id(), children: [b] };

  expect(materializeEditorPath([])(div)).toMatchObject({
    parents: [],
    to: div,
  });
  expect(materializeEditorPath([0])(div)).toMatchObject({
    parents: [div],
    to: b,
  });
  expect(materializeEditorPath([0, 0])(div)).toMatchObject({
    parents: [div, b],
    to: text,
  });
  expect(materializeEditorPath([0, 0, 0])(div)).toMatchObject({
    parents: [div, b],
    to: { editorText: text, offset: 0 },
  });
  expect(materializeEditorPath([0, 0, 1])(div)).toMatchObject({
    parents: [div, b],
    to: { editorText: text, offset: 1 },
  });

  // Nulls.
  expect(materializeEditorPath([0, 0, 0, 0])(div)).toBeNull();
  expect(materializeEditorPath([1])(div)).toBeNull();
  expect(materializeEditorPath([0, 1])(div)).toBeNull();
  expect(materializeEditorPath([0, 0, 2])(div)).toBeNull();
});
