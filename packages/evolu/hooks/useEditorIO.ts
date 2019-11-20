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
import { isDOMSelection, isValidDOMNodeOffset } from '../models/dom';
import { createInfo as modelCreateInfo } from '../models/info';
import { initNonEmptyPath } from '../models/path';
import { eqSelection, isForward, makeSelection } from '../models/selection';
import {
  EditorIO,
  GetDOMNodeByPath,
  GetPathByDOMNode,
  InputEventIORef,
} from '../types';
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
        mapNullable(document => document.getSelection()),
        filter(isDOMSelection),
      ),
    [getDocument],
  );

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
        getDOMSelection(),
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

  const useIORef = () => useRef(new IORef(constVoid)).current;

  const onSelectionChange = useIORef();
  const onFocus = useIORef();
  const onBlur = useIORef();

  const useInputEventIORef = () =>
    useRef<InputEventIORef>(new IORef(event => () => event.preventDefault()))
      .current;

  const onInsertText = useInputEventIORef();
  const onInsertReplacementText = useInputEventIORef();
  const onInsertLineBreak = useInputEventIORef();
  const onInsertParagraph = useInputEventIORef();
  const onInsertOrderedList = useInputEventIORef();
  const onInsertUnorderedList = useInputEventIORef();
  const onInsertHorizontalRule = useInputEventIORef();
  const onInsertFromYank = useInputEventIORef();
  const onInsertFromDrop = useInputEventIORef();
  const onInsertFromPaste = useInputEventIORef();
  const onInsertFromPasteAsQuotation = useInputEventIORef();
  const onInsertTranspose = useInputEventIORef();
  const onInsertCompositionText = useInputEventIORef();
  const onInsertFromComposition = useInputEventIORef();
  const onInsertLink = useInputEventIORef();
  const onDeleteByComposition = useInputEventIORef();
  const onDeleteCompositionText = useInputEventIORef();
  const onDeleteWordBackward = useInputEventIORef();
  const onDeleteWordForward = useInputEventIORef();
  const onDeleteSoftLineBackward = useInputEventIORef();
  const onDeleteSoftLineForward = useInputEventIORef();
  const onDeleteEntireSoftLine = useInputEventIORef();
  const onDeleteHardLineBackward = useInputEventIORef();
  const onDeleteHardLineForward = useInputEventIORef();
  const onDeleteByDrag = useInputEventIORef();
  const onDeleteByCut = useInputEventIORef();
  const onDeleteContent = useInputEventIORef();
  const onDeleteContentBackward = useInputEventIORef();
  const onDeleteContentForward = useInputEventIORef();
  const onHistoryUndo = useInputEventIORef();
  const onHistoryRedo = useInputEventIORef();
  const onFormatBold = useInputEventIORef();
  const onFormatItalic = useInputEventIORef();
  const onFormatUnderline = useInputEventIORef();
  const onFormatStrikeThrough = useInputEventIORef();
  const onFormatSuperscript = useInputEventIORef();
  const onFormatSubscript = useInputEventIORef();
  const onFormatJustifyFull = useInputEventIORef();
  const onFormatJustifyCenter = useInputEventIORef();
  const onFormatJustifyRight = useInputEventIORef();
  const onFormatJustifyLeft = useInputEventIORef();
  const onFormatIndent = useInputEventIORef();
  const onFormatOutdent = useInputEventIORef();
  const onFormatRemove = useInputEventIORef();
  const onFormatSetBlockTextDirection = useInputEventIORef();
  const onFormatSetInlineTextDirection = useInputEventIORef();
  const onFormatBackColor = useInputEventIORef();
  const onFormatFontColor = useInputEventIORef();
  const onFormatFontName = useInputEventIORef();

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
        getPathByDOMNode,
        getSelectionFromDOM,
        getValue,
        isTyping,
        modifyValue,
        onBlur,
        onDeleteByComposition,
        onDeleteByCut,
        onDeleteByDrag,
        onDeleteCompositionText,
        onDeleteContent,
        onDeleteContentBackward,
        onDeleteContentForward,
        onDeleteEntireSoftLine,
        onDeleteHardLineBackward,
        onDeleteHardLineForward,
        onDeleteSoftLineBackward,
        onDeleteSoftLineForward,
        onDeleteWordBackward,
        onDeleteWordForward,
        onFocus,
        onFormatBackColor,
        onFormatBold,
        onFormatFontColor,
        onFormatFontName,
        onFormatIndent,
        onFormatItalic,
        onFormatJustifyCenter,
        onFormatJustifyFull,
        onFormatJustifyLeft,
        onFormatJustifyRight,
        onFormatOutdent,
        onFormatRemove,
        onFormatSetBlockTextDirection,
        onFormatSetInlineTextDirection,
        onFormatStrikeThrough,
        onFormatSubscript,
        onFormatSuperscript,
        onFormatUnderline,
        onHistoryRedo,
        onHistoryUndo,
        onInsertCompositionText,
        onInsertFromComposition,
        onInsertFromDrop,
        onInsertFromPaste,
        onInsertFromPasteAsQuotation,
        onInsertFromYank,
        onInsertHorizontalRule,
        onInsertLineBreak,
        onInsertLink,
        onInsertOrderedList,
        onInsertParagraph,
        onInsertReplacementText,
        onInsertText,
        onInsertTranspose,
        onInsertUnorderedList,
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
      getPathByDOMNode,
      getSelectionFromDOM,
      getValue,
      isTyping,
      modifyValue,
      onBlur,
      onDeleteByComposition,
      onDeleteByCut,
      onDeleteByDrag,
      onDeleteCompositionText,
      onDeleteContent,
      onDeleteContentBackward,
      onDeleteContentForward,
      onDeleteEntireSoftLine,
      onDeleteHardLineBackward,
      onDeleteHardLineForward,
      onDeleteSoftLineBackward,
      onDeleteSoftLineForward,
      onDeleteWordBackward,
      onDeleteWordForward,
      onFocus,
      onFormatBackColor,
      onFormatBold,
      onFormatFontColor,
      onFormatFontName,
      onFormatIndent,
      onFormatItalic,
      onFormatJustifyCenter,
      onFormatJustifyFull,
      onFormatJustifyLeft,
      onFormatJustifyRight,
      onFormatOutdent,
      onFormatRemove,
      onFormatSetBlockTextDirection,
      onFormatSetInlineTextDirection,
      onFormatStrikeThrough,
      onFormatSubscript,
      onFormatSuperscript,
      onFormatUnderline,
      onHistoryRedo,
      onHistoryUndo,
      onInsertCompositionText,
      onInsertFromComposition,
      onInsertFromDrop,
      onInsertFromPaste,
      onInsertFromPasteAsQuotation,
      onInsertFromYank,
      onInsertHorizontalRule,
      onInsertLineBreak,
      onInsertLink,
      onInsertOrderedList,
      onInsertParagraph,
      onInsertReplacementText,
      onInsertText,
      onInsertTranspose,
      onInsertUnorderedList,
      onSelectionChange,
      pathToNodeOffset,
      setDOMSelection,
      setValue,
      warnIfCalledRepeatedly,
    ],
  );
};
