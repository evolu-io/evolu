import { normalize, Value } from './value';
import { createStableIDFactory } from '../../web/tests/integration/helpers';

const id = createStableIDFactory();

test('normalize', () => {
  const element1 = { id: id(), children: [{ id: id(), text: 'a' }] };
  const value1: Value = {
    element: element1,
    hasFocus: false,
  };
  expect(normalize(value1)).toBe(value1);

  const element2 = {
    id: id(),
    children: [{ id: id(), text: 'a' }, { id: id(), text: 'b' }],
  };
  const value2: Value = {
    element: element2,
    hasFocus: false,
  };
  expect(normalize(value2)).not.toBe(value2);
});
