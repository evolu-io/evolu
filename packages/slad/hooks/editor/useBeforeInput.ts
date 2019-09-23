import { RefObject, useEffect, Dispatch } from 'react';
import { EditorAction } from '../../reducers/editorReducer';

export function useBeforeInput(
  divRef: RefObject<HTMLDivElement>,
  dispatch: Dispatch<EditorAction>,
) {
  useEffect(() => {
    const { current: div } = divRef;
    if (div == null) return;

    function handleBeforeInput(event: InputEvent) {
      // In Chrome and Safari, that's how we prevent input events to replace
      // them with custom behavior.
      // As for the other browsers, polyfill, innovate, or die.
      // TODO: Handle IME changes probably via beforeinput and input.
      // TODO: Handle paste.
      event.preventDefault();

      // I suppose we don't have to handle all input types. Let's see.
      // https://www.w3.org/TR/input-events/#interface-InputEvent-Attributes
      // eslint-disable-next-line default-case
      switch (event.inputType) {
        case 'insertText':
          dispatch({ type: 'insertText', text: event.data as string });
          break;
      }
    }

    // @ts-ignore Outdated type defs.
    div.addEventListener('beforeinput', handleBeforeInput);
    return () => {
      // @ts-ignore Outdated type defs.
      div.removeEventListener('beforeinput', handleBeforeInput);
    };
  }, [dispatch, divRef]);
}
