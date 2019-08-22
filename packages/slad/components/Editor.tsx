import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import produce, { Draft, Immutable } from 'immer';
import { assertNever } from 'assert-never';
import {
  SetNodeEditorPath,
  SetNodeEditorPathContext,
} from '../contexts/SetNodeEditorPathContext';
import { EditorElementRenderer } from './EditorElementRenderer';
import {
  RenderEditorElementContext,
  RenderEditorElement,
} from '../contexts/RenderEditorElementContext';
import {
  EditorSelection,
  mapSelectionToEditorSelection,
} from '../models/selection';
import { renderEditorDivElement } from './renderEditorDivElement';
import { EditorElement } from '../models/element';
import { EditorValue } from '../models/value';
import { useDocumentSelectionChange } from '../hooks/useDocumentSelectionChange';
import { useNodesEditorPathsMap } from '../hooks/useNodesEditorPathsMap';
import { usePrevious } from '../hooks/usePrevious';
import { useInvariantEditorElementIsNormalized } from '../hooks/useInvariantEditorElementIsNormalized';

type EditorCommand = Immutable<
  | { type: 'focus'; value: boolean }
  | { type: 'select'; value: EditorSelection | undefined }
  // | { type: 'setValueElement'; value: Element }
>;

type SomeReactDivAtttributes = Pick<
  React.HTMLAttributes<HTMLDivElement>,
  | 'accessKey'
  | 'autoCorrect'
  | 'className'
  | 'id'
  | 'role'
  | 'spellCheck'
  | 'style'
  | 'tabIndex'
>;

export interface EditorProps<T extends EditorElement = EditorElement>
  extends SomeReactDivAtttributes {
  value: EditorValue<T>;
  onChange: (value: EditorValue<T>) => void;
  disabled?: boolean;
  renderElement?: RenderEditorElement<T>;
}

// It's not possible to use React.memo nor React.forwardRef on a component
// with generic type argument.
// https://stackoverflow.com/a/57493789/233902
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087
// Anyway, we don't need it. Instead of memo, we use useMemo.
// Instead of explicit imperative focus and blur, we use EditorValue.
export const Editor = function Editor<T extends EditorElement>({
  value,
  onChange,
  disabled,
  renderElement,
  autoCorrect = 'off', // Disable browser autoCorrect.
  spellCheck = false, // Disable browser spellCheck.
  role = 'textbox',
  ...rest
}: EditorProps<T>) {
  useInvariantEditorElementIsNormalized(value.element);

  // To have stable command like useReducer dispatch is.
  const valueRef = useRef(value);
  valueRef.current = value;
  const { current: command } = useRef((immutableCommand: EditorCommand) => {
    const command = immutableCommand as Draft<EditorCommand>;
    const nextValue = produce(valueRef.current, draft => {
      switch (command.type) {
        case 'focus': {
          draft.hasFocus = command.value;
          break;
        }
        case 'select': {
          draft.selection = command.value;
          break;
        }
        default:
          assertNever(command);
      }
    });
    if (nextValue === valueRef.current) return;
    onChange(nextValue);
  });

  // Map declarative hasFocus to DOM imperative focus and blur methods.
  const divRef = useRef<HTMLDivElement>(null);
  const valueHadFocus = usePrevious(value.hasFocus);
  useEffect(() => {
    const { current: div } = divRef;
    if (!div) return;
    // For the initial render, it behaves like autoFocus prop.
    if (valueHadFocus == null) {
      if (value.hasFocus) div.focus();
      return;
    }
    // Do things only on change.
    // Maybe this logic is not ideal, but React Flare will solve it.
    if (valueHadFocus === false && value.hasFocus) {
      div.focus();
    } else if (valueHadFocus === true && !value.hasFocus) {
      div.blur();
    }
  }, [valueHadFocus, value.hasFocus]);

  const nodesEditorPathsMap = useNodesEditorPathsMap(value);

  useDocumentSelectionChange(
    divRef,
    useCallback(
      (selection: Selection | undefined) => {
        const editorSelection = mapSelectionToEditorSelection(
          selection,
          nodesEditorPathsMap,
        );
        // Editor must remember the last selection when document selection
        // is moved elsewhere to restore it later on focus.
        // In Chrome, contentEditable does not do that.
        // That's why we ignore null values.
        // if (editorSelection == null) return;
        command({ type: 'select', value: editorSelection });
      },
      [command, nodesEditorPathsMap],
    ),
  );

  // useEffect(() => {
  //   if (state.value.selection == null)
  //   // nacist
  //   // if (state.value.selection == null || currentSelectionRef.current == null)
  //   //   return;
  //   // if (selectionsAreEqual(state.value.selection, currentSelectionRef.current))
  //   //   return;
  //   // // eslint-disable-next-line no-console
  //   // console.log('f');
  // }, [state.value.selection]);

  const setNodeEditorPath = useCallback<SetNodeEditorPath>(
    (node, path) => {
      if (path != null) {
        nodesEditorPathsMap.set(node, path);
      } else {
        nodesEditorPathsMap.delete(node);
      }
    },
    [nodesEditorPathsMap],
  );

  const children = useMemo(() => {
    return (
      <SetNodeEditorPathContext.Provider value={setNodeEditorPath}>
        <RenderEditorElementContext.Provider
          value={
            // Cast renderElement, because React context value can't be generic.
            // We know it's safe because only Element API is used.
            ((renderElement ||
              renderEditorDivElement) as unknown) as RenderEditorElement<
              EditorElement
            >
          }
        >
          <EditorElementRenderer element={value.element} path={[]} />
        </RenderEditorElementContext.Provider>
      </SetNodeEditorPathContext.Provider>
    );
  }, [renderElement, setNodeEditorPath, value.element]);

  const handleOnFocus = useCallback(() => {
    command({ type: 'focus', value: true });
  }, [command]);

  const handleOnBlur = useCallback(() => {
    command({ type: 'focus', value: false });
  }, [command]);

  return useMemo(() => {
    return (
      <div
        autoCorrect={autoCorrect}
        contentEditable={!disabled}
        data-gramm // Disable Grammarly Chrome extension.
        onBlur={handleOnBlur}
        onFocus={handleOnFocus}
        ref={divRef}
        role={role}
        spellCheck={spellCheck}
        suppressContentEditableWarning={!disabled}
        tabIndex={disabled ? -1 : 0}
        {...rest}
      >
        {children}
      </div>
    );
  }, [
    autoCorrect,
    children,
    disabled,
    handleOnBlur,
    handleOnFocus,
    rest,
    role,
    spellCheck,
  ]);
};
