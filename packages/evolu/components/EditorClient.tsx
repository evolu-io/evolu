import Debug from 'debug';
import { sequenceT } from 'fp-ts/lib/Apply';
import { empty } from 'fp-ts/lib/Array';
import { constTrue, constVoid } from 'fp-ts/lib/function';
import { IO, map as mapIO } from 'fp-ts/lib/IO';
import { head, last, snoc } from 'fp-ts/lib/NonEmptyArray';
import {
  chain,
  filter,
  fold,
  fromNullable,
  map,
  mapNullable,
  none,
  option,
  some,
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
import { isExistingDOMSelection, isValidDOMNodeOffset } from '../models/dom';
import { createInfo as modelCreateInfo } from '../models/info';
import { initNonEmptyPath } from '../models/path';
import { eqSelection, isForward } from '../models/selection';
import { eqValue, normalize } from '../models/value';
import { reducer as defaultEditorReducer } from '../reducers/reducer';
import { EditorProps, EditorReducer, EditorIO, Value } from '../types';
import { renderReactElement } from './EditorServer';
import { ElementRenderer } from './ElementRenderer';
import { DOMNodeOffset } from '../types/dom';

const debugAction = Debug('action');

export const EditorClient = memo(
  forwardRef<EditorIO, EditorProps>(
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
      const elementRef = useRef<HTMLDivElement>(null);

      // Always normalize outer value. It's fast enough. And we can optimize it later.
      const value = normalize(valueMaybeNotNormalized);

      // We don't want to use useReducer because we don't want derived state.
      // Naive dispatch implementation would re-subscribes listeners too often.
      // React will provide better API because this could be tricky in concurrent mode.
      // https://reactjs.org/docs/hooks-faq.html#how-to-read-an-often-changing-value-from-usecallback
      const dispatchDepsRef = useRef<{
        value: Value;
        reducer: EditorReducer;
        onChange: EditorProps['onChange'];
      }>({ value, reducer, onChange });

      useLayoutEffect(() => {
        dispatchDepsRef.current = { value, reducer, onChange };
      });

      const dispatch = useCallback<EditorIO['dispatch']>(
        action => () => {
          const { value, reducer, onChange } = dispatchDepsRef.current;
          const nextValue = reducer(value, action);
          debugAction(action.type, [value, action, nextValue]);
          if (eqValue.equals(nextValue, value)) return;
          onChange(nextValue);
        },
        [],
      );

      const { afterTyping, isTypingRef } = useAfterTyping();

      const isTyping = useCallback<IO<boolean>>(() => {
        return isTypingRef.current;
      }, [isTypingRef]);

      const getElement = useCallback<EditorIO['getElement']>(
        () => fromNullable(elementRef.current),
        [],
      );

      const getDocument = useCallback<EditorIO['getDocument']>(
        () =>
          pipe(
            getElement(),
            mapNullable(el => el.ownerDocument),
          ),
        [getElement],
      );

      const createDOMRange = useCallback<EditorIO['createDOMRange']>(
        () =>
          pipe(
            getDocument(),
            map(doc => doc.createRange()),
          ),
        [getDocument],
      );

      const getDOMSelection = useCallback<EditorIO['getDOMSelection']>(
        () =>
          pipe(
            getDocument(),
            mapNullable(doc => doc.getSelection()),
          ),
        [getDocument],
      );

      const createInfo = useCallback<EditorIO['createInfo']>(
        selection =>
          modelCreateInfo(selection, dispatchDepsRef.current.value.element),
        [],
      );

      const focus = useCallback<EditorIO['focus']>(() => {
        if (elementRef.current) elementRef.current.focus();
      }, []);

      const {
        getDOMNodeByPath,
        getPathByDOMNode,
        setDOMNodePath,
      } = useDOMNodesPathsMap(value.element);

      const getSelectionFromDOM = useCallback<EditorIO['getSelectionFromDOM']>(
        () =>
          pipe(
            getDOMSelection(),
            filter(isExistingDOMSelection),
            chain(({ anchorNode, anchorOffset, focusNode, focusOffset }) =>
              // Nested pipe is ok, we can always refactor it out later.
              pipe(
                sequenceT(option)(
                  getPathByDOMNode(anchorNode)(),
                  getPathByDOMNode(focusNode)(),
                ),
                map(([anchorPath, focusPath]) => ({
                  anchor: snoc(anchorPath, anchorOffset),
                  focus: snoc(focusPath, focusOffset),
                })),
              ),
            ),
          ),
        [getDOMSelection, getPathByDOMNode],
      );

      const pathToNodeOffset = useCallback<EditorIO['pathToNodeOffset']>(
        path =>
          pipe(
            initNonEmptyPath(path),
            getDOMNodeByPath,
            mapIO(node =>
              pipe(
                node,
                map(node => [node, last(path)] as DOMNodeOffset),
                filter(isValidDOMNodeOffset),
              ),
            ),
          ),
        [getDOMNodeByPath],
      );

      const setDOMSelection = useCallback<EditorIO['setDOMSelection']>(
        selection => () =>
          pipe(
            isForward(selection),
            isForward =>
              sequenceT(option)(
                some(isForward),
                getDOMSelection(),
                createDOMRange(),
                pathToNodeOffset(
                  isForward ? selection.anchor : selection.focus,
                )(),
                pathToNodeOffset(
                  isForward ? selection.focus : selection.anchor,
                )(),
              ),
            fold(
              constVoid,
              ([
                isForward,
                selection,
                range,
                startNodeOffset,
                endNodeOffset,
              ]) => {
                // isValidDOMNodeOffset
                // if
                const [startNode, startOffset] = startNodeOffset;
                const [endNode, endOffset] = endNodeOffset;
                range.setStart(startNode, startOffset);
                range.setEnd(endNode, endOffset);
                selection.removeAllRanges();
                if (isForward) selection.addRange(range);
                else {
                  // https://stackoverflow.com/a/4802994/233902
                  const endRange = range.cloneRange();
                  endRange.collapse(false);
                  selection.addRange(endRange);
                  selection.extend(range.startContainer, range.startOffset);
                }
              },
            ),
          ),
        [createDOMRange, getDOMSelection, pathToNodeOffset],
      );

      const ensureDOMSelectionIsActual = useCallback<
        EditorIO['ensureDOMSelectionIsActual']
      >(
        () =>
          pipe(
            sequenceT(option)(
              dispatchDepsRef.current.value.selection,
              getSelectionFromDOM(),
            ),
            filter(selections => !eqSelection.equals(...selections)),
            map(head),
            fold(constVoid, selection => {
              setDOMSelection(selection)();
            }),
          ),
        [getSelectionFromDOM, setDOMSelection],
      );

      const editorIO = useMemo<EditorIO>(
        () => ({
          afterTyping,
          createDOMRange,
          createInfo,
          dispatch,
          ensureDOMSelectionIsActual,
          focus,
          getDocument,
          getDOMNodeByPath,
          getDOMSelection,
          getElement,
          getPathByDOMNode,
          getSelectionFromDOM,
          isTyping,
          pathToNodeOffset,
          setDOMSelection,
        }),
        [
          afterTyping,
          createDOMRange,
          createInfo,
          dispatch,
          ensureDOMSelectionIsActual,
          focus,
          getDOMNodeByPath,
          getDOMSelection,
          getDocument,
          getElement,
          getPathByDOMNode,
          getSelectionFromDOM,
          isTyping,
          pathToNodeOffset,
          setDOMSelection,
        ],
      );

      useImperativeHandle(ref, () => editorIO);

      // Internal state, it does not belong to Value I suppose.
      const [tabLostFocus, setTabLostFocus] = useState(false);
      const valueHadFocus = usePrevious(value.hasFocus);

      // Map editor declarative focus to imperative DOM focus and blur methods.
      useEffect(
        () =>
          pipe(
            sequenceT(option)(getElement(), getDocument()),
            fold(constVoid, ([element, document]) => {
              const hasFocus = element === document.activeElement;
              if (!valueHadFocus && value.hasFocus) {
                if (!hasFocus) element.focus();
              } else if (valueHadFocus && !value.hasFocus) {
                // Do not call blur when tab lost focus so editor can be focused back.
                // For manual test, click to editor then press cmd-tab twice.
                // Editor selection must be preserved.
                if (hasFocus && !tabLostFocus) element.blur();
              }
            }),
          ),
        [getDocument, getElement, tabLostFocus, value.hasFocus, valueHadFocus],
      );

      useEffect(() => {
        const handleSelectionChange = () =>
          pipe(
            isTypingRef.current ? none : getSelectionFromDOM(),
            filter(s1 =>
              pipe(
                dispatchDepsRef.current.value.selection,
                fold(constTrue, s2 => !eqSelection.equals(s1, s2)),
              ),
            ),
            fold(constVoid, selection => {
              dispatch({ type: 'selectionChange', selection })();
            }),
          );

        return pipe(
          getDocument(),
          fold(
            () => constVoid, // onNone defines what onSome has to return.
            doc => {
              doc.addEventListener('selectionchange', handleSelectionChange);
              return () => {
                doc.removeEventListener(
                  'selectionchange',
                  handleSelectionChange,
                );
              };
            },
          ),
        );
      }, [dispatch, getDocument, getSelectionFromDOM, isTypingRef]);

      // useLayoutEffect is a must to keep browser selection in sync with editor selection.
      // With useEffect, fast typing would lose caret position.
      useLayoutEffect(() => {
        if (!value.hasFocus) return;
        ensureDOMSelectionIsActual();
      }, [value.hasFocus, ensureDOMSelectionIsActual, value.selection]);

      useBeforeInput(editorIO);

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

      const handleEditorElementFocus = useCallback(() => {
        ensureDOMSelectionIsActual();
        setTabLostFocus(false);
        dispatch({ type: 'focus' })();
      }, [dispatch, ensureDOMSelectionIsActual]);

      const handleEditorElementBlur = useCallback(() => {
        const tabLostFocus =
          (elementRef.current &&
            elementRef.current.ownerDocument &&
            elementRef.current.ownerDocument.activeElement ===
              elementRef.current) ||
          false;
        setTabLostFocus(tabLostFocus);
        dispatch({ type: 'blur' })();
      }, [dispatch]);

      return useMemo(() => {
        return (
          <div
            autoCorrect={autoCorrect}
            contentEditable
            data-gramm // Disable Grammarly Chrome extension.
            onBlur={handleEditorElementBlur}
            onFocus={handleEditorElementFocus}
            ref={elementRef}
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
        handleEditorElementBlur,
        handleEditorElementFocus,
        rest,
        role,
        spellCheck,
      ]);
    },
  ),
);

EditorClient.displayName = 'EditorClient';
