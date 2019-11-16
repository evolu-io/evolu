import { empty } from 'fp-ts/lib/Array';
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
import { RenderElementContext } from '../hooks/useRenderElement';
import { useSelection } from '../hooks/useSelection';
import { SetNodePathContext } from '../hooks/useSetDOMNodePathRef';
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

      useSelection(editorIO);
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
