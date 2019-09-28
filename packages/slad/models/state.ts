import produce, { Draft } from 'immer';
import { createElement } from 'react';
import { Optional } from 'utility-types';
import {
  deleteContentElement,
  EditorElement,
  editorElementPath,
  EditorReactElement,
  invariantIsEditorElementPoint,
  jsxToEditorReactElement,
} from './element';
import {
  EditorSelection,
  editorSelectionIsCollapsed,
  editorSelectionsAreEqual,
  invariantEditorSelectionIsDefined,
  moveEditorSelection,
  collapseEditorSelectionToStart,
} from './selection';
import { EditorTextWithOffset, invariantIsEditorTextWithOffset } from './text';

export interface EditorState<T extends EditorElement = EditorReactElement> {
  readonly element: T;
  readonly selection: EditorSelection | null;
  readonly hasFocus: boolean;
}

/**
 * Create editor state. By default, the root element is EditorReactElement.
 */
export function createEditorState<
  T extends EditorState<EditorElement> = EditorState
>({
  element,
  selection = null,
  hasFocus = false,
}: Optional<T, 'hasFocus' | 'selection'>): T {
  return { element, selection, hasFocus } as T;
}

export function createEditorStateWithText({
  text = '',
  selection = null,
  hasFocus = false,
}: {
  text?: string;
  selection?: EditorSelection | null;
  hasFocus?: boolean;
}) {
  return createEditorState({
    element: jsxToEditorReactElement(
      createElement('div', { className: 'root' }, text),
    ),
    selection,
    hasFocus,
  });
}

export function editorStatesAreEqual<T extends EditorElement>(
  editorState1: EditorState<T> | null,
  editorState2: EditorState<T> | null,
): boolean {
  if (editorState1 === editorState2) return true;
  if (editorState1 == null || editorState2 == null) return false;
  return (
    editorState1.element === editorState2.element &&
    editorState1.hasFocus === editorState2.hasFocus &&
    editorSelectionsAreEqual(editorState1.selection, editorState2.selection)
  );
}

export function produceEditorState<T extends EditorElement>(
  recipe: (draft: Draft<EditorState<T>>) => Draft<EditorState<T>> | void,
) {
  return produce(recipe);
}

export function insertText(text: string, optionalSelection?: EditorSelection) {
  return produceEditorState(draft => {
    const selection = optionalSelection || draft.selection;
    if (!invariantEditorSelectionIsDefined(selection)) return;
    if (editorSelectionIsCollapsed(selection)) {
      const point = editorElementPath(selection.anchor)(draft.element);
      if (!invariantIsEditorElementPoint(point)) return;
      if (!invariantIsEditorTextWithOffset(point.to)) return;
      const { editorText, offset } = point.to as Draft<EditorTextWithOffset>;
      editorText.text =
        editorText.text.slice(0, offset) + text + editorText.text.slice(offset);
      draft.selection = moveEditorSelection(text.length)(selection) as Draft<
        EditorSelection
      >;
    } else {
      // TODO: Insert text over selection.
    }
  });
}

export function move(offset: number) {
  return produceEditorState(draft => {
    if (!invariantEditorSelectionIsDefined(draft.selection)) return;
    draft.selection = moveEditorSelection(offset)(draft.selection) as Draft<
      EditorSelection
    >;
  });
}

export function deleteContent(selection: EditorSelection) {
  return produceEditorState(draft => {
    draft.element = deleteContentElement(selection)(draft.element);
    draft.selection = collapseEditorSelectionToStart(selection) as Draft<
      EditorSelection
    >;
  });
}
