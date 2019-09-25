import { RefObject, useEffect, Dispatch } from 'react';
import { EditorAction } from '../../reducers/editorReducer';
import { NodesEditorPathsMap } from '../../models/path';
import {
  rangeToEditorSelection,
  invariantEditorSelectionIsDefined,
  EditorSelection,
} from '../../models/selection';

export function useBeforeInput(
  divRef: RefObject<HTMLDivElement>,
  nodesEditorPathsMap: NodesEditorPathsMap,
  dispatch: Dispatch<EditorAction>,
) {
  useEffect(() => {
    const { current: div } = divRef;
    if (div == null) return;

    function handleBeforeInput(event: InputEvent) {
      // In Chrome and Safari, that's how we prevent input events default behavior
      // to replace it with the custom.
      // As for the other browsers (Firefox), polyfill, innovate, or die.
      // TODO: Handle IME changes probably via beforeinput and input.
      // TODO: Handle paste.
      // TODO: We have to allow text node only changes and EditorTextRenderer has
      // to hande it manually. Replacing BR with text node and vice versa should be
      // possible with React I guess. Like Draft always resets component via flipped
      // A and B keys.
      // TODO: Do not preventDefault on text node changes only:
      //  - insertText
      //  - deleteContentBackward and deleteContentForward with collapsed selection on text.
      //    Otherwise, it should be blocked because model change will update it.

      // TODO:
      // const isTextOnlyChange = false

      event.preventDefault();

      function editorSelectionFromInputEvent(): EditorSelection {
        // We only get the first range, because only Firefox supports multiple ranges.
        // @ts-ignore Outdated types.
        const range = event.getTargetRanges()[0] as Range;
        const selection = rangeToEditorSelection(range, nodesEditorPathsMap);
        if (!invariantEditorSelectionIsDefined(selection))
          return selection as any; // To make TS happy. Invariant throws anyway.
        return selection;
      }

      // I suppose we don't have to handle all input types. Let's see.
      // https://www.w3.org/TR/input-events/#interface-InputEvent-Attributes
      switch (event.inputType) {
        case 'insertText': {
          if (event.data == null) return;
          const selection = editorSelectionFromInputEvent();
          dispatch({ type: 'insertText', selection, text: event.data });
          break;
        }

        // I don't think we need directions, because the result is collapsed.
        case 'deleteContentBackward':
        case 'deleteContentForward': {
          const selection = editorSelectionFromInputEvent();
          dispatch({ type: 'deleteContent', selection });
          break;
        }

        default:
          // eslint-disable-next-line no-console
          console.log(event.inputType);
      }
    }

    // @ts-ignore Outdated types.
    div.addEventListener('beforeinput', handleBeforeInput);
    return () => {
      // @ts-ignore Outdated types.
      div.removeEventListener('beforeinput', handleBeforeInput);
    };
  }, [dispatch, divRef, nodesEditorPathsMap]);
}
