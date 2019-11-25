import { toNullable } from 'fp-ts/lib/Option';
import { eqPath, byDirection, byContains, toPath } from './path';
import { Path } from '../types';

// A helper for tests only. Remember, we don't want to create Path this way,
// because it throws and with functional programming, we never throw.
// But tests are different, they throw.
const p = (json: number[]): Path => {
  const nullable = toNullable(toPath(json));
  if (nullable == null) throw new Error('wrong path');
  return nullable;
};

test('eqPath', () => {
  expect(eqPath.equals(p([1]), p([1]))).toBe(true);
  expect(eqPath.equals(p([0]), p([1]))).toBe(false);
});

test('byDirection', () => {
  expect(byDirection.compare(p([0]), p([0]))).toBe(0);
  expect(byDirection.compare(p([0]), p([1]))).toBe(1);
  expect(byDirection.compare(p([1]), p([0]))).toBe(-1);
  expect(byDirection.compare(p([0]), p([0, 2]))).toBe(1);
  expect(byDirection.compare(p([0, 2]), p([0]))).toBe(1);
  expect(byDirection.compare(p([1, 1, 2]), p([1, 2]))).toBe(1);
  expect(byDirection.compare(p([1, 2]), p([1, 1, 2]))).toBe(-1);
  expect(byDirection.compare(p([1, 1]), p([1, 2]))).toBe(1);
  expect(byDirection.compare(p([1, 2]), p([1, 2]))).toBe(0);
  expect(byDirection.compare(p([1, 2]), p([1, 1]))).toBe(-1);
  expect(byDirection.compare(p([1, 0]), p([1]))).toBe(1);
});

test('byContains', () => {
  expect(byContains.compare(p([0]), p([0]))).toBe(0);
  expect(byContains.compare(p([0]), p([0, 0]))).toBe(1);
  expect(byContains.compare(p([0]), p([0, 1]))).toBe(1);
  expect(byContains.compare(p([0, 1]), p([0]))).toBe(-1);
  expect(byContains.compare(p([0]), p([1]))).toBe(-1);
  expect(byContains.compare(p([1]), p([0]))).toBe(-1);
});
