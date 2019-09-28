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
          // We do not read event.data because
          // 1) It's not reliable for whitespaces. For example, space on the
          //    end of a line in whiteSpace: normal element returns breaking
          //    space while in DOM it's actually a non-breaking space.
          //    Browsers have own strategy how to insert mix of breaking and
          //    non-breaking spaces depending on whiteSpace style of parent.
          // 2) We do not preventDefault anyway, because it can not work
          //    with IME, as it's described in the specification.
          // Therefore, we prefer to read from DOM.
          // Theoretically, we could read current style here and normalize,
          // but that's tricky and I believe unnecessary.
          // Or we can normalize whitespaces once for all. Let's see.

          // Note that in this phase event.target is already updated, but the change
          // is not yet propagated to DOM. So we can read from event, but we can not
          // dispatch event, because DOM change is still pending.
          // https://github.com/facebook/draft-js/blob/master/src/component/handlers/edit/editOnBeforeInput.js

          // So we have to postpone dispatch until DOM is updated.
          // We can not use input, because it's too late because of IME composition.
          // Draft.js uses setImmediate from fbjs which uses npm setImmediate which uses PostMessage:
          // https://github.com/YuzuJS/setImmediate
          // We can not use Promise based resolveImmediate, because it's too early as I manually tested.
          // https://github.com/facebook/fbjs/blob/master/packages/fbjs/src/core/resolveImmediate.js
          // Maybe we can use setTimeout 0
          //  - https://github.com/facebook/draft-js/issues/2127#issue-466994456
          //  - https://github.com/sindresorhus/set-immediate-shim/blob/master/index.js
          // Maybe we can use requestAnimationFrame as suggested in YuzuJS/setImmediate.
          // https://github.com/YuzuJS/setImmediate
          // So we can use: YuzuJS/setImmediate, setTimeout, requestAnimationFrame.
          // I suppose requestAnimationFrame can be too late.
          // I suppose setTimeout is good enough. If not, use YuzuJS/setImmediate like Draft,
          // or extract its modern browsers logic rather.

          // TODO: Read insertedText from event.target because of whitespaces. Or normalize them.
          const insertedText = '\xa0';
          // const insertedText = event.data || '';

          const selection = editorSelectionFromInputEvent();

          setTimeout(() => {
            dispatch({ type: 'insertText', selection, text: insertedText });
          }, 0);

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
