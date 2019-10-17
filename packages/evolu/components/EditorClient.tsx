/* eslint-env browser */
import Debug from 'debug';
import { empty } from 'fp-ts/lib/Array';
import {
  chain,
  fold,
  fromNullable,
  getOrElse,
  none,
  Option,
  some,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import React, {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useBeforeInput } from '../hooks/useBeforeInput';
import { useNodesEditorPathsMapping } from '../hooks/useNodesEditorPathsMapping';
import { usePrevious } from '../hooks/usePrevious';
import { RenderEditorElementContext } from '../hooks/useRenderEditorElement';
import { SetNodeEditorPathContext } from '../hooks/useSetNodeEditorPathRef';
import { RenderEditorElement } from '../models/element';
import { createNodeOffset, NodeOffset } from '../models/node';
import { EditorPath, getParentPath } from '../models/path';
import {
  EditorSelection,
  editorSelectionIsForward,
  eqEditorSelection,
  selectionToEditorSelection,
} from '../models/selection';
import { EditorState, isEditorStateWithSelection } from '../models/state';
import {
  editorReducer as defaultEditorReducer,
  EditorReducer,
  EditorAction,
} from '../reducers/editorReducer';
import { EditorElementRenderer } from './EditorElementRenderer';
import { renderEditorReactElement } from './EditorServer';

type UsefulReactDivAtttributes = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  | 'accessKey'
  | 'autoCorrect'
  | 'className'
  | 'id'
  | 'role'
  | 'spellCheck'
  | 'style'
  | 'tabIndex'
>;

export interface EditorClientProps extends UsefulReactDivAtttributes {
  editorState: EditorState;
  onChange: (editorState: EditorState) => void;
  renderElement?: RenderEditorElement;
  editorReducer?: EditorReducer;
}

const debugEditorAction = Debug('editor:action');

export const EditorClient = memo<EditorClientProps>(
  ({
    editorState,
    onChange,
    renderElement,
    editorReducer = defaultEditorReducer,
    autoCorrect = 'off',
    spellCheck = false,
    role = 'textbox',
    ...rest
  }) => {
    const userIsTypingRef = useRef(false);

    // We don't want to use useReducer because we don't want derived state.
    // Naive dispatch implementation re-subscribes document listeners to often.
    // React will provide better API because this could be tricky in concurrent mode.
    // https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
    const dispatchDepsRef = useRef<{
      editorState: EditorState;
      editorReducer: EditorReducer;
      onChange: EditorClientProps['onChange'];
    }>();
    useLayoutEffect(() => {
      dispatchDepsRef.current = { editorState, editorReducer, onChange };
    });
    const dispatch = useCallback((action: EditorAction) => {
      const { current } = dispatchDepsRef;
      if (current == null)
        throw new Error('Cannot call the dispatch while rendering.');
      const { editorState, editorReducer, onChange } = current;
      const nextState = editorReducer(editorState, action);
      debugEditorAction(action.type, [editorState, action, nextState]);
      // Poor man shallow compare. We need shallow compare to allow a reducer to use a spread.
      const hasChange =
        editorState.element !== nextState.element ||
        editorState.hasFocus !== nextState.hasFocus ||
        // @ts-ignore This is fine.
        editorState.selection !== nextState.selection;
      if (hasChange) onChange(nextState);
    }, []);

    const {
      setNodeEditorPath,
      getNodeByEditorPath,
      getEditorPathByNode,
    } = useNodesEditorPathsMapping(editorState.element);

    const divRef = useRef<HTMLDivElement>(null);

    const [tabLostFocus, setTabLostFocus] = useState(false);

    const editorStateHadFocus = usePrevious(editorState.hasFocus);

    // Map editor declarative focus to imperative DOM focus and blur methods.
    useEffect(() => {
      const { current: div } = divRef;
      if (div == null) return;
      const divHasFocus =
        div === (div.ownerDocument && div.ownerDocument.activeElement);
      if (!editorStateHadFocus && editorState.hasFocus) {
        if (!divHasFocus) div.focus();
      } else if (editorStateHadFocus && !editorState.hasFocus) {
        // Do not call blur when tab lost focus so editor can be focused back.
        // For manual test, click to editor then press cmd-tab twice.
        // Editor selection must be preserved.
        if (divHasFocus && !tabLostFocus) div.blur();
      }
    }, [tabLostFocus, divRef, editorStateHadFocus, editorState.hasFocus]);

    const getSelection = useCallback((): Option<Selection> => {
      return fromNullable(
        // TODO: Use TypeScript 3.7 optional chaining when Prettier will be ready.
        divRef.current &&
          divRef.current.ownerDocument &&
          divRef.current.ownerDocument.getSelection(),
      );
    }, []);

    const editorPathToNodeOffset = useCallback(
      (path: EditorPath): Option<NodeOffset> => {
        return pipe(
          getNodeByEditorPath(path),
          // That's how we can console.log within a pipe.
          // foo => {
          //   console.log(foo);
          //   return foo;
          // },
          fold(
            () =>
              // Text.
              pipe(
                path,
                getParentPath,
                getNodeByEditorPath,
                createNodeOffset(path),
              ),
            element =>
              pipe(
                fromNullable(element.parentNode),
                createNodeOffset(path),
              ),
          ),
        );
      },
      [getNodeByEditorPath],
    );

    const setSelection = useCallback(
      (editorSelection: EditorSelection) => {
        const doc = divRef.current && divRef.current.ownerDocument;
        if (doc == null) return;
        pipe(
          getSelection(),
          fold(
            () => {
              throw new Error('Selection should exists.');
            },
            selection => {
              const isForward = editorSelectionIsForward(editorSelection);

              const [startNode, startOffset] = pipe(
                editorPathToNodeOffset(
                  isForward ? editorSelection.anchor : editorSelection.focus,
                ),
                getOrElse<NodeOffset>(() => {
                  throw new Error('Start NodeOffset should exists.');
                }),
              );

              const [endNode, endOffset] = pipe(
                editorPathToNodeOffset(
                  isForward ? editorSelection.focus : editorSelection.anchor,
                ),
                getOrElse<NodeOffset>(() => {
                  throw new Error('End NodeOffset should exists.');
                }),
              );

              const range = doc.createRange();
              range.setStart(startNode, startOffset);
              range.setEnd(endNode, endOffset);

              selection.removeAllRanges();
              if (isForward) {
                selection.addRange(range);
              } else {
                // https://stackoverflow.com/a/4802994/233902
                const endRange = range.cloneRange();
                endRange.collapse(false);
                selection.addRange(endRange);
                selection.extend(range.startContainer, range.startOffset);
              }
            },
          ),
        );
      },
      [editorPathToNodeOffset, getSelection],
    );

    // Update editor selection by document selection.
    useEffect(() => {
      const doc = divRef.current && divRef.current.ownerDocument;
      if (doc == null) return;

      const handleDocumentSelectionChange = () => {
        if (userIsTypingRef.current) return;
        pipe(
          getSelection(),
          selectionToEditorSelection(getEditorPathByNode),
          fold(
            () => {
              // Editor must remember the last selection when document selection
              // is moved elsewhere to restore it later on focus.
            },
            selection => {
              dispatch({ type: 'selectionChange', selection });
            },
          ),
        );
      };

      doc.addEventListener('selectionchange', handleDocumentSelectionChange);
      return () => {
        doc.removeEventListener(
          'selectionchange',
          handleDocumentSelectionChange,
        );
      };
    }, [dispatch, getEditorPathByNode, getSelection]);

    const maybeUpdateSelection = useCallback(() => {
      if (!isEditorStateWithSelection(editorState)) return;
      pipe(
        getSelection(),
        selectionToEditorSelection(getEditorPathByNode),
        chain(currentSelection => {
          return editorState.selection &&
            eqEditorSelection.equals(currentSelection, editorState.selection)
            ? none
            : some(editorState.selection);
        }),
        fold(
          () => {
            // No selection, nothing to update.
          },
          selection => {
            setSelection(selection);
          },
        ),
      );
    }, [editorState, getEditorPathByNode, getSelection, setSelection]);

    // useLayoutEffect is a must to keep browser selection in sync with editor selection.
    // With useEffect, fast typing would lose caret position.
    useLayoutEffect(() => {
      if (!editorState.hasFocus) return;
      maybeUpdateSelection();
    }, [editorState.hasFocus, maybeUpdateSelection]);

    useBeforeInput(divRef, userIsTypingRef, getEditorPathByNode, dispatch);

    const children = useMemo(() => {
      return (
        <SetNodeEditorPathContext.Provider value={setNodeEditorPath}>
          <RenderEditorElementContext.Provider
            value={renderElement || renderEditorReactElement}
          >
            <EditorElementRenderer element={editorState.element} path={empty} />
          </RenderEditorElementContext.Provider>
        </SetNodeEditorPathContext.Provider>
      );
    }, [editorState.element, renderElement, setNodeEditorPath]);

    const handleDivFocus = useCallback(() => {
      maybeUpdateSelection();
      setTabLostFocus(false);
      dispatch({ type: 'focus' });
    }, [dispatch, maybeUpdateSelection]);

    const handleDivBlur = useCallback(() => {
      const tabLostFocus =
        (divRef.current &&
          divRef.current.ownerDocument &&
          divRef.current.ownerDocument.activeElement === divRef.current) ||
        false;
      setTabLostFocus(tabLostFocus);
      dispatch({ type: 'blur' });
    }, [dispatch]);

    return useMemo(() => {
      return (
        <div
          autoCorrect={autoCorrect}
          contentEditable
          data-gramm // Disable Grammarly Chrome extension.
          onBlur={handleDivBlur}
          onFocus={handleDivFocus}
          ref={divRef}
          role={role}
          spellCheck={spellCheck}
          suppressContentEditableWarning
          suppressHydrationWarning
          // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
          tabIndex={0}
          {...rest}
        >
          {children}
        </div>
      );
    }, [
      autoCorrect,
      children,
      handleDivBlur,
      handleDivFocus,
      rest,
      role,
      spellCheck,
    ]);
  },
);

EditorClient.displayName = 'EditorClient';
