import { createStableIDFactory } from '../../web/tests/integration/helpers';
import {
  deleteContentElement,
  EditorElement,
  editorElementIsNormalized,
  materializeEditorPath,
  normalizeEditorElement,
} from './element';

const id = createStableIDFactory();

test('normalizeEditorElement merges adjacent texts', () => {
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

test('normalizeEditorElement preserves identity', () => {
  const element1: EditorElement = {
    id: id(),
    children: [],
  };
  expect(normalizeEditorElement(element1)).toBe(element1);

  const element2: EditorElement = {
    id: id(),
    children: [{ id: id(), children: [] }, { id: id(), text: 'a' }],
  };
  expect(normalizeEditorElement(element2)).toBe(element2);

  const preservedChild = { id: id(), children: [] };
  const element3: EditorElement = {
    id: id(),
    children: [
      preservedChild,
      { id: id(), text: 'a' },
      { id: id(), text: 'b' },
    ],
  };
  const normalizedElement3 = normalizeEditorElement(element3);
  expect(normalizedElement3).not.toBe(element3);
  expect(normalizedElement3.children[0]).toBe(preservedChild);
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
