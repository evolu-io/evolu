import { createStableIDFactory } from '../../web/tests/integration/helpers';
import { createValue, normalize } from './value';

const id = createStableIDFactory();

test('normalize', () => {
  const element1 = { id: id(), children: [{ id: id(), text: 'a' }] };
  const value1 = createValue({ element: element1 });
  expect(normalize(value1)).toBe(value1);

  const element2 = {
    id: id(),
    children: [{ id: id(), text: 'a' }, { id: id(), text: 'b' }],
  };
  const value2 = createValue({ element: element2 });
  expect(normalize(value2)).not.toBe(value2);
});
