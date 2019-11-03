import { reducer } from './reducer';
import { createValueWithText } from '../models/value';
import { elementToIDless } from '../models/element';
import { Action } from '../types';

const value = createValueWithText();

const testReducer = (action: Action) => {
  const { element, ...nextValue } = reducer(value, action);
  return {
    ...nextValue,
    element: elementToIDless(element),
  };
};

test('focus', () => {
  expect(testReducer({ type: 'focus' })).toMatchSnapshot();
});

test('blur', () => {
  expect(testReducer({ type: 'blur' })).toMatchSnapshot();
});
