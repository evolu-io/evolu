import {
  isCollapsedSelection,
  eqSelection,
  isForwardSelection,
  selectionAsRange,
  Selection,
} from './selection';

test('isCollapsedSelection', () => {
  expect(isCollapsedSelection({ anchor: [0], focus: [0] })).toBe(true);
  expect(isCollapsedSelection({ anchor: [0], focus: [1] })).toBe(false);
});

test('eqSelection', () => {
  const s1: Selection = { anchor: [0], focus: [1] };
  const s2: Selection = { anchor: [0], focus: [1] };
  const s3: Selection = { anchor: [0], focus: [0] };
  expect(eqSelection.equals(s1, s1)).toBe(true);
  expect(eqSelection.equals(s1, s2)).toBe(true);
  expect(eqSelection.equals(s2, s3)).toBe(false);
});

test('isForwardSelection', () => {
  expect(isForwardSelection({ anchor: [0], focus: [0] })).toBe(true);
  expect(isForwardSelection({ anchor: [0], focus: [1] })).toBe(true);
  expect(isForwardSelection({ anchor: [1], focus: [0] })).toBe(false);
});

test('selectionAsRange', () => {
  expect(selectionAsRange({ anchor: [0], focus: [1] })).toMatchObject({
    anchor: [0],
    focus: [1],
  });
  expect(selectionAsRange({ anchor: [1], focus: [0] })).toMatchObject({
    anchor: [0],
    focus: [1],
  });
});
