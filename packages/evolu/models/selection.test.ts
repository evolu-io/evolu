import {
  isCollapsedSelection,
  eqSelection,
  isForwardSelection,
  selectionToRange,
  collapseSelectionToStart,
  collapseSelectionToEnd,
} from './selection';
import { Selection } from '../types';

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

test('collapseSelectionToStart', () => {
  expect(collapseSelectionToStart({ anchor: [0], focus: [1] })).toMatchObject({
    anchor: [0],
    focus: [0],
  });
  expect(collapseSelectionToStart({ anchor: [1], focus: [0] })).toMatchObject({
    anchor: [0],
    focus: [0],
  });
});

test('collapseSelectionToEnd', () => {
  expect(collapseSelectionToEnd({ anchor: [0], focus: [1] })).toMatchObject({
    anchor: [1],
    focus: [1],
  });
  expect(collapseSelectionToEnd({ anchor: [1], focus: [0] })).toMatchObject({
    anchor: [1],
    focus: [1],
  });
});
