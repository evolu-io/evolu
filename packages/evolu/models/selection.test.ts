import {
  isCollapsed,
  eqSelection,
  isForward,
  selectionToRange,
  collapseToStart,
  collapseToEnd,
} from './selection';
import { Selection } from '../types';

test('isCollapsed', () => {
  expect(isCollapsed({ anchor: [0], focus: [0] })).toBe(true);
  expect(isCollapsed({ anchor: [0], focus: [1] })).toBe(false);
});

test('eqSelection', () => {
  const s1: Selection = { anchor: [0], focus: [1] };
  const s2: Selection = { anchor: [0], focus: [1] };
  const s3: Selection = { anchor: [0], focus: [0] };
  expect(eqSelection.equals(s1, s1)).toBe(true);
  expect(eqSelection.equals(s1, s2)).toBe(true);
  expect(eqSelection.equals(s2, s3)).toBe(false);
});

test('isForward', () => {
  expect(isForward({ anchor: [0], focus: [0] })).toBe(true);
  expect(isForward({ anchor: [0], focus: [1] })).toBe(true);
  expect(isForward({ anchor: [1], focus: [0] })).toBe(false);
});

test('selectionToRange', () => {
  expect(selectionToRange({ anchor: [0], focus: [1] })).toMatchObject({
    start: [0],
    end: [1],
  });
  expect(selectionToRange({ anchor: [1], focus: [0] })).toMatchObject({
    start: [0],
    end: [1],
  });
});

test('collapseToStart', () => {
  expect(collapseToStart({ anchor: [0], focus: [1] })).toMatchObject({
    anchor: [0],
    focus: [0],
  });
  expect(collapseToStart({ anchor: [1], focus: [0] })).toMatchObject({
    anchor: [0],
    focus: [0],
  });
});

test('collapseToEnd', () => {
  expect(collapseToEnd({ anchor: [0], focus: [1] })).toMatchObject({
    anchor: [1],
    focus: [1],
  });
  expect(collapseToEnd({ anchor: [1], focus: [0] })).toMatchObject({
    anchor: [1],
    focus: [1],
  });
});
