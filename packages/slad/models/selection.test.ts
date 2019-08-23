import {
  editorSelectionIsCollapsed,
  editorSelectionsAreEqual,
  editorSelectionIsBackward,
} from './selection';

test('editorSelectionIsCollapsed', () => {
  expect(editorSelectionIsCollapsed({ anchor: [], focus: [] })).toBe(true);
  expect(editorSelectionIsCollapsed({ anchor: [], focus: [1] })).toBe(false);
});

test('editorSelectionsAreEqual', () => {
  const s1 = { anchor: [], focus: [1] };
  const s2 = { anchor: [], focus: [1] };
  const s3 = { anchor: [], focus: [] };
  expect(editorSelectionsAreEqual(s1, s1)).toBe(true);
  expect(editorSelectionsAreEqual(s1, s2)).toBe(true);
  expect(editorSelectionsAreEqual(undefined, undefined)).toBe(true);
  expect(editorSelectionsAreEqual(s2, s3)).toBe(false);
  expect(editorSelectionsAreEqual(undefined, s3)).toBe(false);
});

test('editorSelectionIsBackward', () => {
  expect(editorSelectionIsBackward({ anchor: [0], focus: [0] })).toBe(false);
  expect(editorSelectionIsBackward({ anchor: [0], focus: [1] })).toBe(false);
  expect(editorSelectionIsBackward({ anchor: [1], focus: [0] })).toBe(true);
});
