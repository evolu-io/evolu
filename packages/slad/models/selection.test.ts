import { selectionIsCollapsed, selectionsAreEqual } from './selection';

test('selectionIsCollapsed', () => {
  expect(selectionIsCollapsed({ anchor: [], focus: [] })).toBe(true);
  expect(selectionIsCollapsed({ anchor: [], focus: [1] })).toBe(false);
});

test('selectionsAreEqual', () => {
  const s1 = { anchor: [], focus: [1] };
  const s2 = { anchor: [], focus: [1] };
  const s3 = { anchor: [], focus: [] };
  expect(selectionsAreEqual(s1, s1)).toBe(true);
  expect(selectionsAreEqual(s1, s2)).toBe(true);
  expect(selectionsAreEqual(s2, s3)).toBe(false);
});
