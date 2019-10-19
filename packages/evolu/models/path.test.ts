import { eqEditorPath, byDirection } from './path';

test('eqEditorPath', () => {
  expect(eqEditorPath.equals([1], [1])).toBe(true);
  expect(eqEditorPath.equals([0], [1])).toBe(false);
});

test('byDirection', () => {
  expect(byDirection.compare([0], [0])).toBe(0);
  expect(byDirection.compare([0], [1])).toBe(1);
  expect(byDirection.compare([1], [0])).toBe(-1);
  expect(byDirection.compare([0], [0, 2])).toBe(1);
  expect(byDirection.compare([0, 2], [0])).toBe(1);
  expect(byDirection.compare([1, 1, 2], [1, 2])).toBe(1);
  expect(byDirection.compare([1, 2], [1, 1, 2])).toBe(-1);
  expect(byDirection.compare([1, 1], [1, 2])).toBe(1);
  expect(byDirection.compare([1, 2], [1, 2])).toBe(0);
  expect(byDirection.compare([1, 2], [1, 1])).toBe(-1);
  expect(byDirection.compare([1, 0], [1])).toBe(1);
});
