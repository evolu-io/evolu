import {
  editorSelectionIsCollapsed,
  eqEditorSelection,
  editorSelectionIsForward,
  editorSelectionAsRange,
} from './selection';

test('editorSelectionIsCollapsed', () => {
  expect(editorSelectionIsCollapsed({ anchor: [], focus: [] })).toBe(true);
  expect(editorSelectionIsCollapsed({ anchor: [], focus: [1] })).toBe(false);
});

test('eqEditorSelection', () => {
  const s1 = { anchor: [], focus: [1] };
  const s2 = { anchor: [], focus: [1] };
  const s3 = { anchor: [], focus: [] };
  expect(eqEditorSelection.equals(s1, s1)).toBe(true);
  expect(eqEditorSelection.equals(s1, s2)).toBe(true);
  expect(eqEditorSelection.equals(s2, s3)).toBe(false);
});

test('editorSelectionIsForward', () => {
  expect(editorSelectionIsForward({ anchor: [0], focus: [0] })).toBe(true);
  expect(editorSelectionIsForward({ anchor: [0], focus: [1] })).toBe(true);
  expect(editorSelectionIsForward({ anchor: [1], focus: [0] })).toBe(false);
});

test('editorSelectionAsRange', () => {
  expect(editorSelectionAsRange({ anchor: [0], focus: [1] })).toMatchObject({
    anchor: [0],
    focus: [1],
  });
  expect(editorSelectionAsRange({ anchor: [1], focus: [0] })).toMatchObject({
    anchor: [0],
    focus: [1],
  });
});
