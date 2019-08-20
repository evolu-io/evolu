import React, {
  useRef,
  useCallback,
  useMemo,
  useReducer,
  Reducer,
  useEffect,
} from 'react';
import produce, { Draft, Immutable } from 'immer';
import { assertNever } from 'assert-never';
import {
  SetNodeEditorPath,
  SetNodeEditorPathContext,
  Node,
} from '../contexts/SetNodeEditorPathContext';
import { EditorElementRenderer } from './EditorElementRenderer';
import {
  RenderEditorElementContext,
  RenderEditorElement,
} from '../contexts/RenderEditorElementContext';
import { EditorSelection } from '../models/selection';
import { renderEditorDivElement } from './renderEditorDivElement';
import { EditorElement } from '../models/element';
import { EditorValue } from '../models/value';
import { useDocumentSelectionChange } from '../hooks/useDocumentSelectionChange';
import { useNodesEditorPathsMap } from '../hooks/useNodesEditorPathsMap';
import { usePrevious } from '../hooks/usePrevious';
import { useInvariantEditorElementIsNormalized } from '../hooks/useInvariantEditorElementIsNormalized';

type EditorState = Immutable<{
  value: EditorValue<EditorElement>;
}>;

type EditorAction = Immutable<
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
// Instead of explicit imperative focus and blur, we use Value model.
export const Editor = function Editor<T extends EditorElement>({
  value: propsValue,
  onChange,
  disabled,
  renderElement,
  autoCorrect = 'off', // Disable browser autoCorrect.
  spellCheck = false, // Disable browser spellCheck.
  role = 'textbox',
  ...rest
}: EditorProps<T>) {
  const divRef = useRef<HTMLDivElement>(null);

  const reducer: Reducer<EditorState, EditorAction> = (
    state,
    immutableAction,
  ) => {
    const action = immutableAction as Draft<EditorAction>;
    return produce(state, draft => {
      switch (action.type) {
        case 'focus': {
          draft.value.hasFocus = action.value;
          break;
        }
        case 'select': {
          draft.value.selection = action.value;
          break;
        }
        default:
          assertNever(action);
      }
    });
  };

  // We need duplicated state (value) because of stable dispatch.
  // Otherwise, any change would create new callbacks and pass them through
  // the whole tree via context. Also, this allows inner async state changes.
  const [state, dispatch] = useReducer(reducer, {
    value: propsValue,
  });

  useInvariantEditorElementIsNormalized(state.value.element);

  // Propagate inner state to outer.
  useEffect(() => {
    if (state.value === propsValue) return;
    onChange(state.value as EditorValue<T>);
  }, [onChange, propsValue, state.value]);

  // Propagate outer state to inner.
  useEffect(() => {
    dispatch({ type: 'focus', value: propsValue.hasFocus });
  }, [propsValue.hasFocus]);

  // Propagate inner state to DOM.
  // Map declarative hasFocus to DOM imperative focus and blur methods.
  const stateHadFocus = usePrevious(state.value.hasFocus);
  useEffect(() => {
    const { current: div } = divRef;
    if (!div) return;
    // For the initial render, it behaves like autoFocus prop.
    if (stateHadFocus == null) {
      if (state.value.hasFocus) div.focus();
      return;
    }
    // Do things only on change.
    // Maybe this logic is not ideal, but React Flare will solve it.
    if (stateHadFocus === false && state.value.hasFocus) {
      div.focus();
    } else if (stateHadFocus === true && !state.value.hasFocus) {
      div.blur();
    }
  }, [stateHadFocus, state.value.hasFocus]);

  const nodesEditorPathsMap = useNodesEditorPathsMap(state.value);

  const mapSelectionToEditorSelection = useCallback(
    (selection: Selection | undefined): EditorSelection | undefined => {
      if (!selection) return undefined;
      const { anchorNode, anchorOffset, focusNode, focusOffset } = selection;
      if (!anchorNode || !focusNode) return undefined;
      const anchorPath = nodesEditorPathsMap.get(anchorNode as Node);
      const focusPath = nodesEditorPathsMap.get(focusNode as Node);
      if (!anchorPath || !focusPath) return undefined;
      return {
        anchor: [...anchorPath, anchorOffset],
        focus: [...focusPath, focusOffset],
      };
    },
    [nodesEditorPathsMap],
  );

  useDocumentSelectionChange(
    divRef,
    useCallback(
      (selection: Selection | undefined) => {
        const editorSelection = mapSelectionToEditorSelection(selection);
        dispatch({ type: 'select', value: editorSelection });
      },
      [mapSelectionToEditorSelection],
    ),
  );

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
          <EditorElementRenderer element={state.value.element} path={[]} />
        </RenderEditorElementContext.Provider>
      </SetNodeEditorPathContext.Provider>
    );
  }, [renderElement, setNodeEditorPath, state.value.element]);

  const handleOnFocus = useCallback(() => {
    dispatch({ type: 'focus', value: true });
  }, []);

  const handleOnBlur = useCallback(() => {
    dispatch({ type: 'focus', value: false });
  }, []);

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
