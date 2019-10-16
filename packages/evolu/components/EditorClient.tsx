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
  useReducer,
  useRef,
  useState,
} from 'react';
import { useBeforeInput } from '../hooks/useBeforeInput';
import { useNodesEditorPathsMapping } from '../hooks/useNodesEditorPathsMapping';
import { usePrevious } from '../hooks/usePrevious';
import { useReducerWithLogger } from '../hooks/useReducerWithLogger';
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
import { EditorState } from '../models/state';
import {
  editorReducer as defaultEditorReducer,
  EditorReducer,
} from '../reducers/editorReducer';
import { EditorElementRenderer } from './EditorElementRenderer';
import { renderEditorReactElement } from './EditorServer';

const debugEditorAction = Debug('editor:action');

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

export const EditorClient = memo<EditorClientProps>(
  ({
    editorState: parentEditorState,
    onChange,
    renderElement,
    editorReducer = defaultEditorReducer,
    autoCorrect = 'off',
    spellCheck = false,
    role = 'textbox',
    ...rest
  }) => {
    const userIsTypingRef = useRef(false);

    // I am not sure whether we really need inner state.
    // Maybe we can use editorReducer without useReducer via callOnChange.
    // TODO: Try to remove it when we will have enough tests.
    const [editorState, dispatch] = useReducerWithLogger(
      useReducer(editorReducer, parentEditorState),
      debugEditorAction,
    );

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
        // TODO: Use TypeScript 3.7 optional chaining.
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

    const maybeUpdateSelection = useCallback(
      (selection: EditorSelection) => {
        pipe(
          getSelection(),
          selectionToEditorSelection(getEditorPathByNode),
          chain(currentSelection => {
            return selection &&
              eqEditorSelection.equals(currentSelection, selection)
              ? none
              : some(selection);
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
      },
      [getEditorPathByNode, getSelection, setSelection],
    );

    // useLayoutEffect is must to keep browser selection in sync with editor state.
    useLayoutEffect(() => {
      if (!editorState.hasFocus) return;
      // if (!isEditorStateWithSelection(editorState)) return;
      // @ts-ignore
      if (editorState.selection) maybeUpdateSelection(editorState.selection);
      // @ts-ignore
    }, [maybeUpdateSelection, editorState.hasFocus, editorState.selection]);

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
      // if (isEditorStateWithSelection(editorState))
      // @ts-ignore
      if (editorState.selection) maybeUpdateSelection(editorState.selection);
      setTabLostFocus(false);
      dispatch({ type: 'focus' });
      // @ts-ignore
    }, [dispatch, editorState.selection, maybeUpdateSelection]);

    const handleDivBlur = useCallback(() => {
      const tabLostFocus =
        (divRef.current &&
          divRef.current.ownerDocument &&
          divRef.current.ownerDocument.activeElement === divRef.current) ||
        false;
      setTabLostFocus(tabLostFocus);
      dispatch({ type: 'blur' });
    }, [dispatch]);

    // Sync inner editor state with outer.
    // Still not sure whether it's the right approach, but it works.
    const lastParentEditorStateRef = useRef<EditorState>(parentEditorState);
    useLayoutEffect(() => {
      lastParentEditorStateRef.current = parentEditorState;
    }, [parentEditorState]);
    useLayoutEffect(() => {
      const hasChange =
        editorState.element !== lastParentEditorStateRef.current.element ||
        editorState.hasFocus !== lastParentEditorStateRef.current.hasFocus ||
        // @ts-ignore TODO: Probably remove inner state.
        editorState.selection !== lastParentEditorStateRef.current.selection;
      if (hasChange) {
        onChange(editorState);
      }
    }, [editorState, onChange]);

    // Sync outer editor state with inner.
    // Still not sure whether it's the right approach, but it works.
    const editorStateRef = useRef<EditorState>(editorState);
    useLayoutEffect(() => {
      editorStateRef.current = editorState;
    }, [editorState]);
    // We can not just override editorState, because that could override meanwhile
    // updated state props. That's why we use one effect per one prop.
    useLayoutEffect(() => {
      if (parentEditorState.element === editorStateRef.current.element) return;
      dispatch({
        type: 'setEditorState',
        change: { element: parentEditorState.element },
      });
    }, [dispatch, parentEditorState.element]);
    useLayoutEffect(() => {
      if (parentEditorState.hasFocus === editorStateRef.current.hasFocus)
        return;
      dispatch({
        type: 'setEditorState',
        change: { hasFocus: parentEditorState.hasFocus },
      });
    }, [dispatch, parentEditorState.hasFocus]);
    useLayoutEffect(() => {
      // @ts-ignore
      if (parentEditorState.selection === editorStateRef.current.selection)
        return;
      dispatch({
        type: 'setEditorState',
        // @ts-ignore
        change: { selection: parentEditorState.selection },
      });
      // @ts-ignore
    }, [dispatch, parentEditorState.selection]);

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
