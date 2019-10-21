import Debug from 'debug';
import { empty, init } from 'fp-ts/lib/Array';
import { constVoid } from 'fp-ts/lib/function';
import {
  chain,
  fold,
  fromNullable,
  none,
  Option,
  some,
  option,
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
import { sequenceT } from 'fp-ts/lib/Apply';
import { useBeforeInput } from '../hooks/useBeforeInput';
import { useNodesPathsMapping } from '../hooks/useNodesPathsMapping';
import { usePrevious } from '../hooks/usePrevious';
import { RenderElementContext } from '../hooks/useRenderElement';
import { SetNodePathContext } from '../hooks/useSetDOMNodePathRef';
import { RenderElement } from '../models/element';
import { Path } from '../models/path';
import {
  Selection,
  isForwardSelection,
  eqSelection,
  mapDOMSelectionToSelection,
} from '../models/selection';
import { State, isStateWithSelection, normalize } from '../models/state';
import {
  EditorAction,
  editorReducer as defaultEditorReducer,
  EditorReducer,
} from '../reducers/editorReducer';
import { warn } from '../warn';
import { ElementRenderer } from './ElementRenderer';
import { renderReactElement } from './EditorServer';
import {
  DOMNodeOffset,
  createDOMNodeOffset,
  DOMSelection,
} from '../models/dom';

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
  state: State;
  onChange: (state: State) => void;
  renderElement?: RenderElement;
  reducer?: EditorReducer;
}

const debugEditorAction = Debug('editor:action');

export const EditorClient = memo<EditorClientProps>(
  ({
    state: stateMaybeNotNormalized,
    onChange,
    renderElement,
    reducer = defaultEditorReducer,
    autoCorrect = 'off',
    spellCheck = false,
    role = 'textbox',
    ...rest
  }) => {
    // Always normalize outer state. It's fast enough. And we can optimize it later.
    const state = normalize(stateMaybeNotNormalized);

    const userIsTypingRef = useRef(false);

    // We don't want to use useReducer because we don't want derived state.
    // Naive dispatch implementation re-subscribes document listeners to often.
    // React will provide better API because this could be tricky in concurrent mode.
    // https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
    const dispatchDepsRef = useRef<{
      state: State;
      reducer: EditorReducer;
      onChange: EditorClientProps['onChange'];
    }>();
    useLayoutEffect(() => {
      dispatchDepsRef.current = { state, reducer, onChange };
    });
    const dispatch = useCallback((action: EditorAction) => {
      const { current } = dispatchDepsRef;
      if (current == null) return;
      const { state, reducer, onChange } = current;
      const nextState = reducer(state, action);
      debugEditorAction(action.type, [state, action, nextState]);
      if (nextState === state) return;
      onChange(nextState);
    }, []);

    const {
      setDOMNodePath,
      getDOMNodeByPath,
      getPathByDOMNode,
    } = useNodesPathsMapping(state.element);

    const divRef = useRef<HTMLDivElement>(null);

    const [tabLostFocus, setTabLostFocus] = useState(false);

    const stateHadFocus = usePrevious(state.hasFocus);

    // Map editor declarative focus to imperative DOM focus and blur methods.
    useEffect(() => {
      const { current: div } = divRef;
      if (div == null) return;
      const divHasFocus =
        div === (div.ownerDocument && div.ownerDocument.activeElement);
      if (!stateHadFocus && state.hasFocus) {
        if (!divHasFocus) div.focus();
      } else if (stateHadFocus && !state.hasFocus) {
        // Do not call blur when tab lost focus so editor can be focused back.
        // For manual test, click to editor then press cmd-tab twice.
        // Editor selection must be preserved.
        if (divHasFocus && !tabLostFocus) div.blur();
      }
    }, [tabLostFocus, divRef, stateHadFocus, state.hasFocus]);

    // Using divRef is must for iframes.
    const getDOMSelection = useCallback((): Option<DOMSelection> => {
      // TODO: Use TypeScript 3.7 optional chaining when Prettier will be ready.
      return fromNullable(
        divRef.current &&
          divRef.current.ownerDocument &&
          divRef.current.ownerDocument.getSelection(),
      );
    }, []);

    // Using divRef is must for iframes.
    const getRange = useCallback((): Option<Range> => {
      // TODO: Use TypeScript 3.7 optional chaining when Prettier will be ready.
      return fromNullable(
        divRef.current &&
          divRef.current.ownerDocument &&
          divRef.current.ownerDocument.createRange(),
      );
    }, []);

    const pathToNodeOffset = useCallback(
      (path: Path): Option<DOMNodeOffset> => {
        return pipe(
          getDOMNodeByPath(path),
          // That's how we can console.log within a pipe.
          // foo => {
          //   console.log(foo);
          //   return foo;
          // },
          fold(
            () =>
              pipe(
                path,
                init,
                chain(getDOMNodeByPath),
                createDOMNodeOffset(path),
              ),
            element =>
              pipe(
                fromNullable(element.parentNode),
                createDOMNodeOffset(path),
              ),
          ),
        );
      },
      [getDOMNodeByPath],
    );

    const setSelection = useCallback(
      (selection: Selection) => {
        const bla = isForwardSelection(selection);
        pipe(
          sequenceT(option)(
            getDOMSelection(),
            getRange(),
            pathToNodeOffset(bla ? selection.anchor : selection.focus),
            pathToNodeOffset(bla ? selection.focus : selection.anchor),
          ),
          fold(
            () => {
              warn('DOMSelection, DOMRange, and DOMNodeOffsets should exists.');
            },
            ([selection, range, startNodeOffset, endNodeOffset]) => {
              range.setStart(...startNodeOffset);
              range.setEnd(...endNodeOffset);
              selection.removeAllRanges();
              if (bla) {
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
      [pathToNodeOffset, getRange, getDOMSelection],
    );

    // Update editor selection by DOM selection.
    useEffect(() => {
      const doc = divRef.current && divRef.current.ownerDocument;
      if (doc == null) return;

      const handleDocumentSelectionChange = () => {
        if (userIsTypingRef.current) return;
        pipe(
          getDOMSelection(),
          chain(mapDOMSelectionToSelection(getPathByDOMNode)),
          // We ignore none because editor has to remember the last selection to
          // restore it later on the focus.
          fold(constVoid, selection => {
            dispatch({ type: 'selectionChange', selection });
          }),
        );
      };

      doc.addEventListener('selectionchange', handleDocumentSelectionChange);
      return () => {
        doc.removeEventListener(
          'selectionchange',
          handleDocumentSelectionChange,
        );
      };
    }, [dispatch, getPathByDOMNode, getDOMSelection]);

    const maybeUpdateSelection = useCallback(() => {
      if (!isStateWithSelection(state)) return;
      pipe(
        getDOMSelection(),
        chain(mapDOMSelectionToSelection(getPathByDOMNode)),
        chain(currentSelection => {
          return state.selection &&
            eqSelection.equals(currentSelection, state.selection)
            ? none
            : some(state.selection);
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
    }, [state, getPathByDOMNode, getDOMSelection, setSelection]);

    // useLayoutEffect is a must to keep browser selection in sync with editor selection.
    // With useEffect, fast typing would lose caret position.
    useLayoutEffect(() => {
      if (!state.hasFocus) return;
      maybeUpdateSelection();
    }, [state.hasFocus, maybeUpdateSelection]);

    useBeforeInput(divRef, userIsTypingRef, getPathByDOMNode, dispatch);

    const children = useMemo(() => {
      return (
        <SetNodePathContext.Provider value={setDOMNodePath}>
          <RenderElementContext.Provider
            value={renderElement || renderReactElement}
          >
            <ElementRenderer element={state.element} path={empty} />
          </RenderElementContext.Provider>
        </SetNodePathContext.Provider>
      );
    }, [state.element, renderElement, setDOMNodePath]);

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
