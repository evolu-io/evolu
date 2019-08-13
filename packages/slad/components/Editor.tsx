import React, { CSSProperties, useRef, useCallback, useMemo } from 'react';
import produce, { Immutable, Draft } from 'immer';
import { assertNever } from 'assert-never';
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
import {
  // To avoid clash with browser Selection.
  Selection as ModelSelection,
  selectionIsCollapsed,
} from '../models/selection';
import { renderDivElement } from './renderDivElement';
import { Element } from '../models/element';
import { Value } from '../models/value';
import { useDocumentSelectionChange } from '../hooks/useDocumentSelectionChange';
import { Path } from '../models/path';
import { useNodesPathsMap } from '../hooks/useNodesPathsMap';

type CommandAction = Draft<
  | { type: 'setSelection'; selection: ModelSelection | undefined }
  | { type: 'insertText'; path: Path; text: string }
>;

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

// No memo for two reasons:
//  1) It's not possible to memoize generic component.
//  2) We prefer better memoize granularity via inner useMemo anyway.
export function Editor<T extends Element>({
  value,
  onChange,
  disabled,
  renderElement,
  ...rest
}: EditorProps<T>) {
  // const [state, ]
  // nastavim state,
  // proc pak ale command? proc ne dispatch?
  // protoze reducer musi bejt pure, ok
  // a ja treba budu chtit, co ja vim, uvidime, ok

  const handleCommand = useCallback(
    (draft: Draft<Value<T>>, action: CommandAction) => {
      switch (action.type) {
        case 'setSelection': {
          draft.selection = action.selection;
          break;
        }
        case 'insertText': {
          // draft.element = insertText(action.path, action.text, draft.element)
          // najit el, zmenit mu child
          // to je nice draft zmena, ok
          // action.path.reduce((element, index) => {
          //   // node.children
          //   // pokud neni, element? ne
          // }, draft.element)
          break;
        }
        default:
          return assertNever(action);
      }
    },
    [],
  );

  // Note casting from immutable to mutable. TypeScript is right with enforcing it.
  const command = useCallback(
    (action: Immutable<CommandAction>) => {
      onChange(
        produce(value, draft => {
          handleCommand(draft, action as Draft<CommandAction>);
        }),
      );
    },
    [handleCommand, onChange, value],
  );

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
      command({ type: 'setSelection', selection: modelSelection });
    },
    [command, mapSelectionToModelSelection],
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

  // just a quick test!
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (value.selection == null) return;
      if (!selectionIsCollapsed(value.selection)) return;
      command({
        type: 'insertText',
        path: value.selection.focus,
        text: event.key,
      });
    },
    [command, value.selection],
  );

  return useMemo(() => {
    return (
      <div
        contentEditable={!disabled}
        ref={divRef}
        role="textbox"
        suppressContentEditableWarning={!disabled}
        tabIndex={disabled ? -1 : 0}
        // TODO: Remove this test!
        onKeyDown={handleKeyDown}
        {...rest}
      >
        {children}
      </div>
    );
  }, [children, disabled, handleKeyDown, rest]);
}
