/* eslint-env browser */
import { Dispatch, RefObject, useEffect, MutableRefObject } from 'react';
import { NodesEditorPathsMap } from '../../models/path';
import {
  collapseEditorSelectionToStart,
  editorSelectionOfParent,
  editorSelectionFromInputEvent,
  editorSelectionIsCollapsed,
  editorSelectionForChild,
  moveEditorSelection,
} from '../../models/selection';
import { EditorAction } from '../../reducers/editorReducer';

export function useBeforeInput(
  divRef: RefObject<HTMLDivElement>,
  userIsTypingRef: MutableRefObject<boolean>,
  nodesEditorPathsMap: NodesEditorPathsMap,
  dispatch: Dispatch<EditorAction>,
) {
  useEffect(() => {
    const { current: div } = divRef;
    if (div == null) return;

    let lastAfterTypingCallback: () => void = () => {};
    function afterTyping(callback: () => void) {
      userIsTypingRef.current = true;
      lastAfterTypingCallback = callback;
      requestAnimationFrame(() => {
        userIsTypingRef.current = false;
        lastAfterTypingCallback();
      });
    }

    function handleBeforeInput(event: InputEvent) {
      // In Chrome and Safari, we can use event.preventDefault to replace browsers
      // default behavior with custom. As for Firefox, we can polyfill it somehow, but
      // Firefox is already working on beforeinput support, so let's wait.
      // https://bugzilla.mozilla.org/show_bug.cgi?id=970802

      // We don't prevent writing and deleting on collapsed selection, because we have
      // to allow it to read real content from DOM. Real content is text automatically
      // corrected by spellcheck, or by an extension, or by contentEditable itself
      // when whitespaces are updated in whiteSpace != pre elements.

      // But there is an issue with Chrome. Chrome sometimes dispatches subsequent
      // events so quickly, that no async callback can catch them. I have tried every
      // macrotask implementation without any success. Microtask is fast enough, but
      // DOM is not yet updated in such case. Thats's lastAfterTypingCallback exists.

      // I suppose we don't have to handle all input types. Let's see.
      // https://www.w3.org/TR/input-events/#interface-InputEvent-Attributes
      switch (event.inputType) {
        case 'insertText': {
          // Note we don't read from event.data, because it can return wrong whitespaces.
          // Note we don't prevent insertText to happen because it blinks spellcheck
          // and interfere with IME.
          // https://www.w3.org/TR/input-events/#interface-InputEvent-Attributes
          // As result, the contentEditable element can contain non-breaking space while
          // event.data contains normal space. Therefore, we have to read whole text node.
          // Theoretically, we could normalize whitespaces like browsers do
          // https://files-o9umkgame.now.sh/Screenshot%202019-09-27%20at%2000.47.25.png
          // , but we would have to compute whitespace collapsing, which is hard.
          // There is some blog post explaining all cases of running blocks etc., but
          // I suppose we don't need it. We can extract text from DOM instead.
          // https://github.com/steida/slad/issues/47
          // Btw, that's why all contentEditable editors require whitespace pre.
          if (event.data == null) return;

          const selection = editorSelectionFromInputEvent(
            event,
            nodesEditorPathsMap,
          );

          // @ts-ignore Missing getTargetRanges.
          const range = event.getTargetRanges()[0] as Range;

          // Store reference to text node to read from it when selection is collapsed.
          // We can not just insert text, because whitespaces can be changed anywhere.
          const { startContainer } = range;

          // When user types on empty text, which is represented as BR, browsers will
          // replace BR with text node. Because React can not recognize outer change,
          // we have to put BR immediately back manually.
          const maybeBR = range.startContainer.childNodes[range.startOffset];
          const brIsGoingToBeReplacedWithText =
            range.startContainer === range.endContainer &&
            maybeBR != null &&
            maybeBR.nodeName === 'BR';

          const selectionAfterInsert = brIsGoingToBeReplacedWithText
            ? editorSelectionForChild(1, 1)(selection)
            : moveEditorSelection(event.data.length)(selection);

          afterTyping(() => {
            const text = startContainer.textContent || '';
            // Put BR back to DOM for React. Otherwise:
            // Uncaught DOMException: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
            if (brIsGoingToBeReplacedWithText) {
              startContainer.replaceChild(
                maybeBR,
                startContainer.firstChild as ChildNode,
              );
            }
            dispatch({
              type: 'insertText',
              text,
              selection: selectionAfterInsert,
            });
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

          // When nothing is going to be deleted, do nothing.
          if (editorSelectionIsCollapsed(selection)) return;

          // Store reference to text node to read from it when selection is collapsed.
          // We can't just delete text, because whitespaces can be changed anywhere.
          // @ts-ignore Missing getTargetRanges
          const { startContainer } = event.getTargetRanges()[0] as Range;

          // When text node content is going to be emptied, browsers replace
          // text node with BR. Because React can not recognize outer change, we have to
          // prevent default, so text node can be properly replaced with BR by React.
          // @ts-ignore Missing getTargetRanges.
          const range = event.getTargetRanges()[0] as Range;

          const textIsGoingToBeReplacedWithBR =
            range.startContainer === range.endContainer &&
            range.startOffset === 0 &&
            (range.startContainer as Text).data.length === range.endOffset;
          if (textIsGoingToBeReplacedWithBR) event.preventDefault();

          const selectionAfterDelete = textIsGoingToBeReplacedWithBR
            ? editorSelectionOfParent(selection)
            : collapseEditorSelectionToStart(selection);

          afterTyping(() => {
            const { data } = startContainer as Text;
            // Because we prevented default action to allow React to do update,
            // we have to set empty text manually.
            const text = textIsGoingToBeReplacedWithBR ? '' : data;
            dispatch({
              type: 'deleteText',
              text,
              selection: selectionAfterDelete,
            });
          });
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
  }, [dispatch, divRef, nodesEditorPathsMap, userIsTypingRef]);
}
