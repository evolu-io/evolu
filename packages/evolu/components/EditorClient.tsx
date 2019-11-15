import { empty } from 'fp-ts/lib/Array';
import { constTrue, constVoid } from 'fp-ts/lib/function';
import { filter, fold, none } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import React, {
  forwardRef,
  memo,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { useAfterTyping } from '../hooks/useAfterTyping';
import { useBeforeInput } from '../hooks/useBeforeInput';
import { useDispatch } from '../hooks/useDispatch';
import { useDOMNodesPathsMap } from '../hooks/useDOMNodesPathsMap';
import { useEditorIO } from '../hooks/useEditorIO';
import { useFocus } from '../hooks/useFocus';
import { RenderElementContext } from '../hooks/useRenderElement';
import { SetNodePathContext } from '../hooks/useSetDOMNodePathRef';
import { eqSelection } from '../models/selection';
import { EditorIO, EditorProps } from '../types';
import { renderReactElement } from './EditorServer';
import { ElementRenderer } from './ElementRenderer';

export const EditorClient = memo(
  forwardRef<EditorIO, EditorProps>(
    (
      {
        value,
        onChange,
        renderElement,
        autoCorrect = 'off',
        spellCheck = false,
        role = 'textbox',
        ...rest
      },
      ref,
    ) => {
      const elementRef = useRef<HTMLDivElement>(null);

      const [dispatch, valueRef] = useDispatch(onChange, value);

      const { afterTyping, isTypingRef } = useAfterTyping();

      const {
        getDOMNodeByPath,
        getPathByDOMNode,
        setDOMNodePath,
      } = useDOMNodesPathsMap(value.element);

      const editorIO = useEditorIO(
        elementRef,
        isTypingRef,
        afterTyping,
        valueRef,
        dispatch,
        getDOMNodeByPath,
        getPathByDOMNode,
      );

      useImperativeHandle(ref, () => editorIO);

      const { onFocus, onBlur } = useFocus(value.hasFocus, editorIO);

      useEffect(() => {
        const handleSelectionChange = () =>
          pipe(
            isTypingRef.current ? none : editorIO.getSelectionFromDOM(),
            filter(s1 =>
              pipe(
                valueRef.current.selection,
                fold(constTrue, s2 => !eqSelection.equals(s1, s2)),
              ),
            ),
            fold(constVoid, selection => {
              dispatch({ type: 'selectionChange', selection })();
            }),
          );

        return pipe(
          editorIO.getDocument(),
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
      }, [dispatch, editorIO, isTypingRef, valueRef]);

      // useLayoutEffect is a must to keep browser selection in sync with editor selection.
      // With useEffect, fast typing would lose caret position.
      useLayoutEffect(() => {
        if (!value.hasFocus) return;
        editorIO.ensureDOMSelectionIsActual();
      }, [value.hasFocus, value.selection, editorIO]);

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

      return useMemo(() => {
        return (
          <div
            autoCorrect={autoCorrect}
            contentEditable
            data-gramm // Disable Grammarly Chrome extension.
            onBlur={onBlur}
            onFocus={onFocus}
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
      }, [autoCorrect, children, onBlur, onFocus, rest, role, spellCheck]);
    },
  ),
);

EditorClient.displayName = 'EditorClient';
