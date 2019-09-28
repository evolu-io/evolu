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
      // to replace it with the custom. As for Firefox, we can polyfill it somehow but
      // I believe Firefox will add support for beforeinput or it will die.
      // TODO: Handle paste.

      // Do not prevent default on writing because of IME which is not cancelable.
      // const isTextNodeOnlyChange = ...
      // event.preventDefault();

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
          // There is a problem with event.data.
          // When an user press space on text line end with style whiteSpace != pre,
          // event.data returns a space, but in DOM a non-breaking space is rendered.
          // It happens when we do not prevent default for insertText,
          // which we can't because of IME anyway.
          // Therefore, we have two options:
          //  1) Normalize whitespace manually all the time.
          //  2) Extract inserted text from event.target. Note we can not read from DOM,
          //     because DOM is not yet updated in this phase.
          // We can not use input event, because it's too late for IME.

          // TODO: Read insertedText from event.target because of whitespaces. Or normalize them.
          const insertText = '\xa0';
          // const insertText = event.data || '';
          const selection = editorSelectionFromInputEvent();

          // We have to postpone dispatch until DOM is updated because EditorTextRenderer
          // reads from it. Draft.js uses setImmediate from fbjs which uses npm setImmediate.
          // I have tried several other approaches, but setTimeout and requestAnimationFrame
          // are too slow, and Promise.then to early. Old YuzuJS/setImmediate is still the best.
          // https://github.com/facebook/draft-js/blob/master/src/component/handlers/edit/editOnBeforeInput.js
          setImmediate(() => {
            console.log('g');
            dispatch({ type: 'insertText', selection, text: insertText });
          });

          break;
        }

        // https://www.w3.org/TR/input-events/#interface-InputEvent-Attributes
        // "...or delete the selection with the selection collapsing to its start after the deletion"
        // "...or delete the selection with the selection collapsing to its end after the deletion"
        // I don't understand why the direction matters, because when a content is
        // deleted, selection should always be collapsed to start.
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
