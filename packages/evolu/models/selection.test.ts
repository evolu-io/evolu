import {
  isCollapsed,
  eqSelection,
  isForward,
  selectionToRange,
  collapseToStart,
  collapseToEnd,
  unsafeSelection,
} from './selection';
import { Selection } from '../types';

const s = unsafeSelection;

test('isCollapsed', () => {
  expect(isCollapsed(s({ anchor: [0], focus: [0] }))).toBe(true);
  expect(isCollapsed(s({ anchor: [0], focus: [1] }))).toBe(false);
});

test('eqSelection', () => {
  const s1: Selection = s({ anchor: [0], focus: [1] });
  const s2: Selection = s({ anchor: [0], focus: [1] });
  const s3: Selection = s({ anchor: [0], focus: [0] });
  expect(eqSelection.equals(s1, s1)).toBe(true);
  expect(eqSelection.equals(s1, s2)).toBe(true);
  expect(eqSelection.equals(s2, s3)).toBe(false);
});

test('isForward', () => {
  expect(isForward(s({ anchor: [0], focus: [0] }))).toBe(true);
  expect(isForward(s({ anchor: [0], focus: [1] }))).toBe(true);
  expect(isForward(s({ anchor: [1], focus: [0] }))).toBe(false);
});

test('selectionToRange', () => {
  expect(selectionToRange(s({ anchor: [0], focus: [1] }))).toMatchObject({
    start: [0],
    end: [1],
  });
  expect(selectionToRange(s({ anchor: [1], focus: [0] }))).toMatchObject({
    start: [0],
    end: [1],
  });
});

test('collapseToStart', () => {
  expect(collapseToStart(s({ anchor: [0], focus: [1] }))).toMatchObject({
    anchor: [0],
    focus: [0],
  });
  expect(collapseToStart(s({ anchor: [1], focus: [0] }))).toMatchObject({
    anchor: [0],
    focus: [0],
  });
});

test('collapseToEnd', () => {
  expect(collapseToEnd(s({ anchor: [0], focus: [1] }))).toMatchObject({
    anchor: [1],
    focus: [1],
  });
  expect(collapseToEnd(s({ anchor: [1], focus: [0] }))).toMatchObject({
    anchor: [1],
    focus: [1],
  });
});
