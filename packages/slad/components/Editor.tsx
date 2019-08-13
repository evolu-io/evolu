import React, { CSSProperties, useRef, useCallback, useMemo } from 'react';
import {
  SetNodePath,
  SetNodePathContext,
  Node,
} from '../contexts/SetNodePathContext';
import { EditorElement } from './EditorElement';
import {
  RenderElementContext,
  RenderElement,
} from '../contexts/RenderElementContext';
import { Selection as ModelSelection } from '../models/selection';
import { renderDivElement } from './renderDivElement';
import { Element } from '../models/element';
import { Value } from '../models/value';
import { useDocumentSelectionChange } from '../hooks/useDocumentSelectionChange';
import { useNodesPathsMap } from '../hooks/useNodesPathsMap';

export interface EditorProps<T extends Element> {
  value: Value<T>;
  onChange: (value: Value<T>) => void;
  disabled?: boolean;
  renderElement?: RenderElement<T>;
  // Some React HTMLAttributes.
  autoCapitalize?: string;
  autoCorrect?: 'on' | 'off';
  className?: string;
  role?: string;
  spellCheck?: boolean;
  style?: CSSProperties;
  tabIndex?: number;
}

// No React.memo for two reasons:
//  1) It's not possible to use memo on a component with generic type.
//  2) We prefer better memoize granularity via inner useMemo anyway.
export const Editor = function Editor<T extends Element>({
  value,
  onChange,
  disabled,
  renderElement,
  ...rest
}: EditorProps<T>) {
  // jednoznacne naklonovat type, popsat, ze je to must,

  const nodesPathsMap = useNodesPathsMap(value);

  const mapSelectionToModelSelection = useCallback(
    (selection: Selection | undefined): ModelSelection | undefined => {
      if (!selection) return undefined;
      const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
      if (!anchorNode || !focusNode) return undefined;
      const anchorPath = nodesPathsMap.get(anchorNode as Node);
      const focusPath = nodesPathsMap.get(focusNode as Node);
      if (!anchorPath || !focusPath) return undefined;
      return {
        anchor: [...anchorPath, anchorOffset],
        focus: [...focusPath, focusOffset],
      };
    },
    [nodesPathsMap],
  );

  const handleDocumentSelectionChange = useCallback(
    (selection: Selection | undefined) => {
      const modelSelection = mapSelectionToModelSelection(selection);
      onChange({
        ...value,
        selection: modelSelection,
      });
    },
    [mapSelectionToModelSelection, onChange, value],
  );

  const divRef = useRef<HTMLDivElement>(null);
  useDocumentSelectionChange(divRef, handleDocumentSelectionChange);

  const setNodePath = useCallback<SetNodePath>(
    (node, path) => {
      if (path != null) {
        nodesPathsMap.set(node, path);
      } else {
        nodesPathsMap.delete(node);
      }
    },
    [nodesPathsMap],
  );

  // Cast renderElement, because React context value can't be generic.
  const renderEditorElement =
    (renderElement as RenderElement<Element> | undefined) || renderDivElement;

  // Granular "shouldComponentUpdate" ftw.
  const children = useMemo(() => {
    return (
      <SetNodePathContext.Provider value={setNodePath}>
        <RenderElementContext.Provider value={renderEditorElement}>
          <EditorElement element={value.element} path={[]} />
        </RenderElementContext.Provider>
      </SetNodePathContext.Provider>
    );
  }, [renderEditorElement, setNodePath, value.element]);

  return useMemo(() => {
    return (
      <div
        contentEditable={!disabled}
        ref={divRef}
        role="textbox"
        suppressContentEditableWarning={!disabled}
        tabIndex={disabled ? -1 : 0}
        {...rest}
      >
        {children}
      </div>
    );
  }, [children, disabled, rest]);
};
