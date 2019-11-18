import React, { forwardRef, memo, useImperativeHandle, useRef } from 'react';
import { useAfterTyping } from '../hooks/useAfterTyping';
import { useBeforeInput } from '../hooks/useBeforeInput';
import { useDOMNodesPathsMap } from '../hooks/useDOMNodesPathsMap';
import { useEditorIO } from '../hooks/useEditorIO';
import { useSelection } from '../plugins/useSelection';
import { EditorIO, EditorProps } from '../types';
import { EditorElement } from './EditorElement';
import { EditorChildren } from './EditorChildren';
import { useSelectionChange } from '../hooks/useSelectionChange';
import { useFocus } from '../plugins/useFocus';
import { useValue } from '../hooks/useValue';

export const EditorClient = memo(
  forwardRef<EditorIO, EditorProps>(
    ({ value, onChange, renderElement, ...rest }, ref) => {
      const elementRef = useRef<HTMLDivElement>(null);

      const [getValue, setValue, modifyValue] = useValue(value, onChange);

      const { afterTyping, isTyping } = useAfterTyping();

      const {
        getDOMNodeByPath,
        getPathByDOMNode,
        setDOMNodePath,
      } = useDOMNodesPathsMap(value.element);

      const editorIO = useEditorIO(
        afterTyping,
        elementRef,
        getDOMNodeByPath,
        getPathByDOMNode,
        getValue,
        isTyping,
        modifyValue,
        setValue,
      );
      useImperativeHandle(ref, () => editorIO);

      useSelectionChange(editorIO);
      useBeforeInput(editorIO);

      useSelection({ current: editorIO });
      useFocus({ current: editorIO });

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
