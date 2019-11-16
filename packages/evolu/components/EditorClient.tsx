import React, { forwardRef, memo, useImperativeHandle, useRef } from 'react';
import { useAfterTyping } from '../hooks/useAfterTyping';
import { useBeforeInput } from '../hooks/useBeforeInput';
import { useDispatch } from '../hooks/useDispatch';
import { useDOMNodesPathsMap } from '../hooks/useDOMNodesPathsMap';
import { useEditorIO } from '../hooks/useEditorIO';
import { useSelection } from '../hooks/useSelection';
import { EditorIO, EditorProps } from '../types';
import { EditorElement } from './EditorElement';
import { EditorChildren } from './EditorChildren';

export const EditorClient = memo(
  forwardRef<EditorIO, EditorProps>(
    ({ value, onChange, renderElement, ...rest }, ref) => {
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
      useSelection(editorIO);
      useBeforeInput(editorIO);

      return (
        <EditorElement editorIO={editorIO} elementRef={elementRef} attrs={rest}>
          <EditorChildren
            setDOMNodePath={setDOMNodePath}
            renderElement={renderElement}
            element={value.element}
          />
        </EditorElement>
      );
    },
  ),
);

EditorClient.displayName = 'EditorClient';
