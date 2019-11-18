import { sequenceS, sequenceT } from 'fp-ts/lib/Apply';
import { constVoid } from 'fp-ts/lib/function';
import { io, map as mapIO } from 'fp-ts/lib/IO';
import { head, last, snoc } from 'fp-ts/lib/NonEmptyArray';
import {
  chain,
  filter,
  fold,
  fromNullable,
  map,
  mapNullable,
  option,
  some,
} from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Task } from 'fp-ts/lib/Task';
import { RefObject, useCallback, useMemo, useRef } from 'react';
import { IORef } from 'fp-ts/lib/IORef';
import { isExistingDOMSelection, isValidDOMNodeOffset } from '../models/dom';
import { createInfo as modelCreateInfo } from '../models/info';
import { initNonEmptyPath } from '../models/path';
import { eqSelection, isForward, makeSelection } from '../models/selection';
import { EditorIO, GetDOMNodeByPath, GetPathByDOMNode } from '../types';
import { DOMNodeOffset } from '../types/dom';
import { warn } from '../warn';

export const useEditorIO = (
  afterTyping: Task<void>,
  elementRef: RefObject<HTMLDivElement>,
  getDOMNodeByPath: GetDOMNodeByPath,
  getPathByDOMNode: GetPathByDOMNode,
  getValue: EditorIO['getValue'],
  isTyping: EditorIO['isTyping'],
  modifyValue: EditorIO['modifyValue'],
  setValue: EditorIO['setValue'],
): EditorIO => {
  const getElement = useCallback<EditorIO['getElement']>(
    () => fromNullable(elementRef.current),
    [elementRef],
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

  const getExistingDOMSelection = useCallback<
    EditorIO['getExistingDOMSelection']
  >(() => pipe(getDOMSelection(), filter(isExistingDOMSelection)), [
    getDOMSelection,
  ]);

  const createInfo = useCallback<EditorIO['createInfo']>(
    selection => modelCreateInfo(selection, getValue().element),
    [getValue],
  );

  const focus = useCallback<EditorIO['focus']>(() => {
    if (elementRef.current) elementRef.current.focus();
  }, [elementRef]);

  const getSelectionFromDOM = useCallback<EditorIO['getSelectionFromDOM']>(
    () =>
      pipe(
        getExistingDOMSelection(),
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
    [getExistingDOMSelection, getPathByDOMNode],
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
            pathToNodeOffset(isForward ? selection.anchor : selection.focus)(),
            pathToNodeOffset(isForward ? selection.focus : selection.anchor)(),
          ),
        fold(
          constVoid,
          ([isForward, selection, range, startNodeOffset, endNodeOffset]) => {
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
        sequenceT(option)(getValue().selection, getSelectionFromDOM()),
        filter(([s1, s2]) => !eqSelection.equals(s1, s2)),
        map(head),
        fold(constVoid, selection => {
          setDOMSelection(selection)();
        }),
      ),
    [getSelectionFromDOM, getValue, setDOMSelection],
  );

  const DOMRangeToSelection = useCallback<EditorIO['DOMRangeToSelection']>(
    range =>
      pipe(
        sequenceS(io)({
          anchorPath: getPathByDOMNode(range.startContainer),
          focusPath: getPathByDOMNode(range.endContainer),
        }),
        mapIO(sequenceS(option)),
        mapIO(
          chain(({ anchorPath, focusPath }) =>
            makeSelection({
              anchorPath,
              anchorOffset: range.startOffset,
              focusPath,
              focusOffset: range.endOffset,
            }),
          ),
        ),
      ),
    [getPathByDOMNode],
  );

  const { current: onSelectionChange } = useRef(new IORef(constVoid));
  const { current: onFocus } = useRef(new IORef(constVoid));
  const { current: onBlur } = useRef(new IORef(constVoid));

  const useMemoCalled = useRef(false);
  const warnIfCalledRepeatedly = useCallback(<A>(a: A): A => {
    if (useMemoCalled.current) warn('Fix deps in useEditorIO!');
    useMemoCalled.current = true;
    return a;
  }, []);

  return useMemo<EditorIO>(
    () =>
      warnIfCalledRepeatedly({
        afterTyping,
        createDOMRange,
        createInfo,
        DOMRangeToSelection,
        ensureDOMSelectionIsActual,
        focus,
        getDocument,
        getDOMNodeByPath,
        getDOMSelection,
        getElement,
        getExistingDOMSelection,
        getPathByDOMNode,
        getSelectionFromDOM,
        getValue,
        isTyping,
        modifyValue,
        onBlur,
        onFocus,
        onSelectionChange,
        pathToNodeOffset,
        setDOMSelection,
        setValue,
      }),
    [
      afterTyping,
      createDOMRange,
      createInfo,
      DOMRangeToSelection,
      ensureDOMSelectionIsActual,
      focus,
      getDocument,
      getDOMNodeByPath,
      getDOMSelection,
      getElement,
      getExistingDOMSelection,
      getPathByDOMNode,
      getSelectionFromDOM,
      getValue,
      isTyping,
      modifyValue,
      onBlur,
      onFocus,
      onSelectionChange,
      pathToNodeOffset,
      setDOMSelection,
      setValue,
      warnIfCalledRepeatedly,
    ],
  );
};
