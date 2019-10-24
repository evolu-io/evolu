import { editorReducer } from './reducer';
import { createValueWithText } from '../models/value';
import { mapElementToIDless } from '../models/element';
import { Action } from '../types';

const value = createValueWithText();

const testEditorReducer = (action: Action) => {
  const { element, ...nextValue } = editorReducer(value, action);
  return {
    ...nextValue,
    element: mapElementToIDless(element),
  };
};

test('focus', () => {
  expect(testEditorReducer({ type: 'focus' })).toMatchSnapshot();
});

test('blur', () => {
  expect(testEditorReducer({ type: 'blur' })).toMatchSnapshot();
});
