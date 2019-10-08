import { eqEditorPath, editorPathsAreForward } from './path';

test('eqEditorPath', () => {
  expect(eqEditorPath.equals([], [])).toBe(true);
  expect(eqEditorPath.equals([1], [1])).toBe(true);
  expect(eqEditorPath.equals([], [1])).toBe(false);
});

test('editorPathsAreForward', () => {
  expect(editorPathsAreForward([], [])).toBe(true);
  expect(editorPathsAreForward([], [1])).toBe(true);
  expect(editorPathsAreForward([0], [0, 2])).toBe(true);
  expect(editorPathsAreForward([0], [1])).toBe(true);
  expect(editorPathsAreForward([1, 1, 2], [1, 2])).toBe(true);
  expect(editorPathsAreForward([1, 1], [1, 2])).toBe(true);
  expect(editorPathsAreForward([1, 2], [1, 1, 2])).toBe(false);
  expect(editorPathsAreForward([1, 2], [1, 1])).toBe(false);
  expect(editorPathsAreForward([1, 2], [1, 3])).toBe(true);
  expect(editorPathsAreForward([1], [0])).toBe(false);
  expect(editorPathsAreForward([1, 0], [1])).toBe(true);
});
