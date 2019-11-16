import React, {
  forwardRef,
  memo,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { useAfterTyping } from '../hooks/useAfterTyping';
import { useBeforeInput } from '../hooks/useBeforeInput';
import { useDispatch } from '../hooks/useDispatch';
import { useDOMNodesPathsMap } from '../hooks/useDOMNodesPathsMap';
import { useEditorIO } from '../hooks/useEditorIO';
import { useFocus } from '../hooks/useFocus';
import { useSelection } from '../hooks/useSelection';
import { EditorIO, EditorProps } from '../types';
import { EditorChildren } from './EditorChildren';

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

      const { onFocus, onBlur } = useFocus(editorIO);

      useSelection(editorIO);
      useBeforeInput(editorIO);

      // Jo, ale co? EditorElement? jo
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
            <EditorChildren
              setDOMNodePath={setDOMNodePath}
              renderElement={renderElement}
              element={value.element}
            />
          </div>
        );
      }, [
        autoCorrect,
        onBlur,
        onFocus,
        renderElement,
        rest,
        role,
        setDOMNodePath,
        spellCheck,
        value.element,
      ]);
    },
  ),
);

EditorClient.displayName = 'EditorClient';
