import { Dispatch, RefObject, useEffect } from 'react';
import { NodesEditorPathsMap } from '../../models/path';
import { editorSelectionFromInputEvent } from '../../models/selection';
import { EditorAction } from '../../reducers/editorReducer';

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
      // I believe Firefox will add support for beforeinput soon.

      // Do not prevent default on writing because of IME which is not cancelable.
      // const isTextNodeOnlyChange = ...
      // event.preventDefault();

      // I suppose we don't have to handle all input types. Let's see.
      // https://www.w3.org/TR/input-events/#interface-InputEvent-Attributes
      switch (event.inputType) {
        case 'insertText': {
          // Note we don't read from event.data, because it can return wrong whitespaces.
          // Note we don't prevent insertText to happen because we can't because of IME.
          // As result, the contentEditable element can contain non-breaking space while
          // event.data contains normal space. Therefore, we have to read whole text node.
          // Theoretically, we could normalize whitespaces like browsers do
          // https://files-o9umkgame.now.sh/Screenshot%202019-09-27%20at%2000.47.25.png
          // , but we would have to compute whitespace collapsing, which is hard.
          // There is some blog post explaining all cases of running blocks etc., but
          // I suppose we don't need it. We can extract inserted text from DOM instead.
          // Btw, that's why all contentEditable editors require whitespace pre.
          // It probably does not cover all edge cases, but I believe it's good enough.
          if (event.data == null) return;

          // Store reference to DOM element to read when selection is collapsed.
          // @ts-ignore Outdated types.
          const { startContainer } = event.getTargetRanges()[0] as Range;

          // We have to postpone dispatch until DOM is updated because EditorTextRenderer
          // reads from it. Draft.js uses setImmediate from fbjs which uses npm setImmediate.
          // I have tried several other approaches, but setTimeout and requestAnimationFrame
          // are too late while Promise.then is too early. YuzuJS/setImmediate is the best.
          // https://github.com/facebook/draft-js/blob/master/src/component/handlers/edit/editOnBeforeInput.js
          setImmediate(() => {
            const text = startContainer.nodeValue as string;
            dispatch({ type: 'setText', text });
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
          const selection = editorSelectionFromInputEvent(
            event,
            nodesEditorPathsMap,
          );
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
