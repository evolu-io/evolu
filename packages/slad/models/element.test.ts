import {
  normalizeEditorElement,
  EditorElement,
  editorElementIsNormalized,
  deleteContentElement,
  materializeEditorPath,
} from './element';
import { EditorNodeID } from './node';

// Stable EditorNodeID factory for test snapshots.
let lastID = 0;
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
  const text = { id: '1' as EditorNodeID, text: 'a' };
  const b = { id: '2' as EditorNodeID, children: [text] };
  const div = { id: '3' as EditorNodeID, children: [b] };

  expect(materializeEditorPath([])(div)).toMatchSnapshot();
  expect(materializeEditorPath([0])(div)).toMatchSnapshot();
  expect(materializeEditorPath([0, 0])(div)).toMatchSnapshot();
  expect(materializeEditorPath([0, 0, 0])(div)).toMatchSnapshot();
  expect(materializeEditorPath([0, 0, 1])(div)).toMatchSnapshot();

  // Nulls.
  expect(materializeEditorPath([0, 0, 0, 0])(div)).toMatchSnapshot();
  expect(materializeEditorPath([1])(div)).toMatchSnapshot();
  expect(materializeEditorPath([0, 1])(div)).toMatchSnapshot();
  expect(materializeEditorPath([0, 0, 2])(div)).toMatchSnapshot();
});
