import Debug from 'debug';
import { sequenceT } from 'fp-ts/lib/Apply';
import { empty } from 'fp-ts/lib/Array';
import { constVoid } from 'fp-ts/lib/function';
import { last } from 'fp-ts/lib/NonEmptyArray';
import {
  alt,
  chain,
  filter,
  fold,
  fromNullable,
  map,
  mapNullable,
  Option,
  option,
  toNullable,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useAfterTyping } from '../hooks/useAfterTyping';
import { useBeforeInput } from '../hooks/useBeforeInput';
import { useDOMNodesPathsMap } from '../hooks/useDOMNodesPathsMap';
import { usePrevious } from '../hooks/usePrevious';
import { RenderElementContext } from '../hooks/useRenderElement';
import { SetNodePathContext } from '../hooks/useSetDOMNodePathRef';
import {
  createDOMNodeOffset,
  createDOMRange,
  getDOMSelection,
} from '../models/dom';
import { createInfo as modelCreateInfo } from '../models/info';
import { initPath } from '../models/path';
import {
  DOMSelectionToSelection,
  eqSelection,
  isForwardSelection,
} from '../models/selection';
import { normalize } from '../models/value';
import { reducer as defaultEditorReducer } from '../reducers/reducer';
import {
  Action,
  DOMNodeOffset,
  EditorProps,
  EditorRef,
  Path,
  Reducer,
  Selection,
  Value,
} from '../types';
import { warn } from '../warn';
import { renderReactElement } from './EditorServer';
import { ElementRenderer } from './ElementRenderer';

const debugAction = Debug('action');

export const EditorClient = memo(
  forwardRef<EditorRef, EditorProps>(
    (
      {
        value: valueMaybeNotNormalized,
        onChange,
        renderElement,
        reducer = defaultEditorReducer,
        autoCorrect = 'off',
        spellCheck = false,
        role = 'textbox',
        ...rest
      },
      ref,
    ) => {
      // Always normalize outer value. It's fast enough. And we can optimize it later.
      const value = normalize(valueMaybeNotNormalized);

      // We don't want to use useReducer because we don't want derived state.
      // Naive dispatch implementation would re-subscribes listeners too often.
      // React will provide better API because this could be tricky in concurrent mode.
      // https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
      const dispatchDepsRef = useRef<{
        value: Value;
        reducer: Reducer;
        onChange: EditorProps['onChange'];
      }>({ value, reducer, onChange });
      useLayoutEffect(() => {
        dispatchDepsRef.current = { value, reducer, onChange };
      });
      const dispatch = useCallback((action: Action) => {
        const { value, reducer, onChange } = dispatchDepsRef.current;
        const nextValue = reducer(value, action);
        debugAction(action.type, [value, action, nextValue]);
        if (nextValue === value) return;
        onChange(nextValue);
      }, []);

      const {
        setDOMNodePath,
        getDOMNodeByPath,
        getPathByDOMNode,
      } = useDOMNodesPathsMap(value.element);

      const divRef = useRef<HTMLDivElement>(null);

      const getDocument = useCallback(
        () =>
          pipe(
            fromNullable(divRef.current),
            mapNullable(div => div.ownerDocument),
          ),
        [],
      );

      const focus = useCallback<EditorRef['focus']>(() => {
        if (divRef.current) divRef.current.focus();
      }, []);

      const createInfo = useCallback<EditorRef['createInfo']>(
        selection =>
          modelCreateInfo(selection, dispatchDepsRef.current.value.element),
        [],
      );

      useImperativeHandle(ref, () => ({ focus, createInfo }));

      // Internal state, it does not belong to Value I suppose.
      const [tabLostFocus, setTabLostFocus] = useState(false);
      const valueHadFocus = usePrevious(value.hasFocus);

      // Map editor declarative focus to imperative DOM focus and blur methods.
      useEffect(() => {
        const { current: div } = divRef;
        if (div == null) return;
        const divHasFocus =
          div === (div.ownerDocument && div.ownerDocument.activeElement);
        if (!valueHadFocus && value.hasFocus) {
          if (!divHasFocus) div.focus();
        } else if (valueHadFocus && !value.hasFocus) {
          // Do not call blur when tab lost focus so editor can be focused back.
          // For manual test, click to editor then press cmd-tab twice.
          // Editor selection must be preserved.
          if (divHasFocus && !tabLostFocus) div.blur();
        }
      }, [value.hasFocus, tabLostFocus, valueHadFocus]);

      const getSelection = useCallback((): Option<Selection> => {
        return pipe(
          getDOMSelection(divRef.current),
          chain(DOMSelectionToSelection(getPathByDOMNode)),
        );
      }, [getPathByDOMNode]);

      const pathToNodeOffset = useCallback(
        (path: Path): Option<DOMNodeOffset> =>
          pipe(
            path,
            getDOMNodeByPath,
            mapNullable(node => node.parentNode),
            alt(() =>
              pipe(
                path,
                initPath,
                chain(getDOMNodeByPath),
              ),
            ),
            map(createDOMNodeOffset(last(path))),
          ),
        [getDOMNodeByPath],
      );

      const setDOMSelection = useCallback(
        (selection: Selection) => {
          const isForward = isForwardSelection(selection);
          pipe(
            sequenceT(option)(
              getDOMSelection(divRef.current),
              createDOMRange(divRef.current),
              pathToNodeOffset(isForward ? selection.anchor : selection.focus),
              pathToNodeOffset(isForward ? selection.focus : selection.anchor),
            ),
            fold(
              () => {
                warn(
                  'DOMSelection, DOMRange, and DOMNodeOffsets should exists.',
                );
              },
              ([selection, range, startNodeOffset, endNodeOffset]) => {
                range.setStart(...startNodeOffset);
                range.setEnd(...endNodeOffset);
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
        [pathToNodeOffset],
      );

      const { afterTyping, isTypingRef } = useAfterTyping();

      const handleSelectionChange = useCallback(() => {
        if (isTypingRef.current) return;
        pipe(
          getSelection(),
          // We ignore none because editor has to remember the last selection
          // to restore it later on the focus.
          fold(constVoid, selection => {
            const info = createInfo(selection);
            dispatch({ type: 'selectionChange', selection, info });
          }),
        );
      }, [createInfo, dispatch, getSelection, isTypingRef]);

      useEffect(() => {
        const doc = toNullable(getDocument());
        if (doc == null) return;
        doc.addEventListener('selectionchange', handleSelectionChange);
        return () => {
          doc.removeEventListener('selectionchange', handleSelectionChange);
        };
      }, [getDocument, handleSelectionChange]);

      const ensureDOMSelectionIsActual = useCallback(() => {
        pipe(
          sequenceT(option)(value.selection, getSelection()),
          filter(([s1, s2]) => !eqSelection.equals(s1, s2)),
          fold(constVoid, ([selection]) => {
            setDOMSelection(selection);
          }),
        );
      }, [getSelection, setDOMSelection, value.selection]);

      // useLayoutEffect is a must to keep browser selection in sync with editor selection.
      // With useEffect, fast typing would lose caret position.
      useLayoutEffect(() => {
        if (!value.hasFocus) return;
        ensureDOMSelectionIsActual();
      }, [value.hasFocus, ensureDOMSelectionIsActual]);

      useBeforeInput(divRef, afterTyping, getPathByDOMNode, dispatch);

      const children = useMemo(() => {
        return (
          <SetNodePathContext.Provider value={setDOMNodePath}>
            <RenderElementContext.Provider
              value={renderElement || renderReactElement}
            >
              <ElementRenderer element={value.element} path={empty} />
            </RenderElementContext.Provider>
          </SetNodePathContext.Provider>
        );
      }, [value.element, renderElement, setDOMNodePath]);

      const handleDivFocus = useCallback(() => {
        ensureDOMSelectionIsActual();
        setTabLostFocus(false);
        dispatch({ type: 'focus' });
      }, [dispatch, ensureDOMSelectionIsActual]);

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
  ),
);

EditorClient.displayName = 'EditorClient';
