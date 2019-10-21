import { normalize, State } from './state';
import { createStableIDFactory } from '../../web/tests/integration/helpers';

const id = createStableIDFactory();

test('normalize', () => {
  const element1 = { id: id(), children: [{ id: id(), text: 'a' }] };
  const state1: State = {
    element: element1,
    hasFocus: false,
  };
  expect(normalize(state1)).toBe(state1);

  const element2 = {
    id: id(),
    children: [{ id: id(), text: 'a' }, { id: id(), text: 'b' }],
  };
  const state2: State = {
    element: element2,
    hasFocus: false,
  };
  expect(normalize(state2)).not.toBe(state2);
});
