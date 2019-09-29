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
          // The whitespaces problem:
          // event.data can be a space even if rendered DOM will contain a non-breaking space.
          // As rendered DOM, it means when default action is not prevented.
          // And we can not prevent default action in insertText, because it would disable IME.
          // So event.data could be a space (32) when DOM will contain a non-breaking space (160),
          // so EditorTextRenderer will override it. It's no-go.
          // Theoretically, we can normalize whitespaces like browsers do:
          // https://files-o9umkgame.now.sh/Screenshot%202019-09-27%20at%2000.47.25.png
          // but it would be very brittle. One mistake and EditorTextRenderer will override DOM,
          // and it will lead to unexpected whitespaces collapse.
          // We would have to compute manually when whitespace is going to be collapsed aka
          // reverse engineering layout rendering (vomiting smiley).
          // That's why all contentEditable browsers enforce whitespace: pre.

          // TODO: Uz je to jasne, musim nacist co je.
          // Je to mozne, pac znam delku a pozici v dom, ok.

          // TODO: Read insertedText from event.target because of whitespaces. Or normalize them.
          // const insertText = '\xa0';
          if (event.data == null) return;
          const insertText = event.data;
          const selection = editorSelectionFromInputEvent();

          // We have to postpone dispatch until DOM is updated because EditorTextRenderer
          // reads from it. Draft.js uses setImmediate from fbjs which uses npm setImmediate.
          // I have tried several other approaches, but setTimeout and requestAnimationFrame
          // are too slow, and Promise.then to early. Old YuzuJS/setImmediate is still the best.
          // https://github.com/facebook/draft-js/blob/master/src/component/handlers/edit/editOnBeforeInput.js
          setImmediate(() => {
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
