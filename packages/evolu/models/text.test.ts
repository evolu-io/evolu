import { isText } from './text';
import { id } from './node';
import { Text, Node, Element } from '../types';

test('isText', () => {
  const node: Node = { id: id() };
  expect(isText(node)).toBe(false);

  const element: Element = { id: id(), children: [] };
  expect(isText(element)).toBe(false);

  const text: Text = { id: id(), text: 'f' };
  expect(isText(text)).toBe(true);
});
