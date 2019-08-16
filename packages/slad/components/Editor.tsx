import React, {
  CSSProperties,
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
import { usePrevious } from '../hooks/usePrevious';

type EditorState = Immutable<{
  value: Value<Element>;
}>;

type EditorAction = Immutable<
  | { type: 'focus'; value: boolean }
  | { type: 'select'; value: ModelSelection | undefined }
  // | { type: 'setValueElement'; value: Element }
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

// It's not possible to use React.memo nor React.forwardRef on a component
// with generic type argument.
// https://stackoverflow.com/a/57493789/233902
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087
// Maybe, we don't need them. Instead of memo, we can use useMemo.
// Instead of explicit imperative focus and blur, we can use Value model I suppose.
// Maybe new React Flare will solve it. The same for forwardRef.
// If we will really need forwardRef, we can force types via casting.
export const Editor = function Editor<T extends Element>({
  value: propsValue,
  onChange,
  disabled,
  renderElement,
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

  // We need duplicated state (value) because of stable dispatch and render changes.
  // Otherwise, any value change would propagate new callbacks through the whole tree
  // via context. As for render changes, select after focus can't wait for parent update.
  const [state, dispatch] = useReducer(reducer, {
    value: propsValue,
  });

  // Propagate inner state to outer. Conditionally per value.
  useEffect(() => {
    if (state.value === propsValue) return;
    onChange(state.value as Value<T>);
  }, [onChange, propsValue, state.value]);

  // Propagate outer state to inner. Conditionally per props.
  // We can't compare with state here because it would invalidate useEffect deps.
  // And it's compared in reducer anyway.
  useEffect(() => {
    dispatch({ type: 'focus', value: propsValue.hasFocus });
  }, [propsValue.hasFocus]);
  // TODO: tohle to zacykli, pokud mam 2x hasFocus. proc?
  // useEffect(() => {
  //   dispatch({ type: 'select', value: propsValue.selection });
  // }, [propsValue.selection]);

  // Map declarative state hasFocus to DOM imperative focus and blur methods.
  const stateHadFocus = usePrevious(state.value.hasFocus);
  useEffect(() => {
    const { current: div } = divRef;
    if (!div) return;
    // autoFocus like behavior.
    if (stateHadFocus == null) {
      if (state.value.hasFocus) div.focus();
      return;
    }
    if (stateHadFocus === false && state.value.hasFocus) {
      div.focus();
    } else if (stateHadFocus === true && !state.value.hasFocus) {
      div.blur();
    }
  }, [stateHadFocus, state.value.hasFocus]);

  const nodesPathsMap = useNodesPathsMap(state.value);

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
      dispatch({ type: 'select', value: modelSelection });
    },
    [mapSelectionToModelSelection],
  );

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

  const children = useMemo(() => {
    return (
      <SetNodePathContext.Provider value={setNodePath}>
        <RenderElementContext.Provider
          value={
            // Cast renderElement, because React context value can't be generic,
            // afaik. We know it's safe because only Element API is used.
            // TODO: Figure out how to cast it without 'as unknown'.
            ((renderElement || renderDivElement) as unknown) as RenderElement<
              Element
            >
          }
        >
          <EditorElement element={state.value.element} path={[]} />
        </RenderElementContext.Provider>
      </SetNodePathContext.Provider>
    );
  }, [renderElement, setNodePath, state.value.element]);

  const handleOnFocus = useCallback(() => {
    dispatch({ type: 'focus', value: true });
  }, []);

  const handleOnBlur = useCallback(() => {
    dispatch({ type: 'focus', value: false });
  }, []);

  return useMemo(() => {
    return (
      <div
        contentEditable={!disabled}
        ref={divRef}
        role="textbox"
        suppressContentEditableWarning={!disabled}
        tabIndex={disabled ? -1 : 0}
        onFocus={handleOnFocus}
        onBlur={handleOnBlur}
        {...rest}
      >
        {children}
      </div>
    );
  }, [children, disabled, handleOnBlur, handleOnFocus, rest]);
};
