import {
  editorSelectionIsCollapsed,
  editorSelectionsAreEqual,
  editorSelectionIsForward,
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
  expect(editorSelectionsAreEqual(null, null)).toBe(true);
  expect(editorSelectionsAreEqual(s2, s3)).toBe(false);
  expect(editorSelectionsAreEqual(null, s3)).toBe(false);
});

test('editorSelectionIsForward', () => {
  expect(editorSelectionIsForward({ anchor: [0], focus: [0] })).toBe(true);
  expect(editorSelectionIsForward({ anchor: [0], focus: [1] })).toBe(true);
  expect(editorSelectionIsForward({ anchor: [1], focus: [0] })).toBe(false);
});
