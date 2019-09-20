import { assertNever } from 'assert-never';
import produce, { Draft } from 'immer';
import { Reducer } from 'react';
import { EditorElement, getParentElementByPath } from '../models/element';
import { EditorState } from '../models/state';
import {
  EditorSelection,
  invariantEditorSelectionIsDefined,
  invariantEditorSelectionIsCollapsed,
} from '../models/selection';
import { EditorPath } from '../models/path';
import { invariantIsEditorText, editorTextsAreEqual } from '../models/text';

export type EditorAction =
  | { type: 'onFocus' }
  | { type: 'onBlur' }
  | { type: 'onSelectionChange'; selection: EditorSelection | null }
  | { type: 'onTextChange'; path: EditorPath; text: string }
  | {
      type: 'onParentEditorStateChange';
      change: Partial<EditorState<EditorElement>>;
    };

export type EditorReducer<T extends EditorElement> = Reducer<
  EditorState<T>,
  EditorAction
>;

/**
 * Create editor reducer from Immer producer.
 */
export function createEditorReducer<T extends EditorElement = EditorElement>(
  producer: (draft: Draft<EditorState<T>>, action: EditorAction) => void,
): EditorReducer<T> {
  return produce(producer) as EditorReducer<T>;
}

export const editorReducer = createEditorReducer((draft, action) => {
  switch (action.type) {
    case 'onFocus':
      draft.hasFocus = true;
      return;

    case 'onBlur':
      draft.hasFocus = false;
      return;

    case 'onSelectionChange':
      // Yep, we have to explicitly cast to mutable type. That's how we tell
      // TypeScript "I know what I am doing.".
      draft.selection = action.selection as Draft<EditorSelection>;
      return;

    case 'onTextChange': {
      const { path, text } = action;
      // console.log(text.split('').map(char => char.charCodeAt(0)));
      if (!invariantEditorSelectionIsDefined(draft.selection)) return;
      invariantEditorSelectionIsCollapsed(draft.selection);
      const parent = getParentElementByPath(draft.element, path) as Draft<
        EditorElement
      >;
      const childIndex = path.slice(-1)[0];
      const currentChild = parent.children[childIndex];
      if (!invariantIsEditorText(currentChild)) return;
      const newChild = { ...currentChild, text };
      if (editorTextsAreEqual(currentChild, newChild)) return;
      parent.children[childIndex] = newChild;
      if (text.length === 0) {
        // Empty text is BR so the path must be without text node offset part.
        draft.selection.anchor = path as Draft<EditorPath>;
        draft.selection.focus = path as Draft<EditorPath>;
      } else if (currentChild.text.length === 0 && text.length > 0) {
        // We are going to render text node instead of BR so add text node offset.
        draft.selection.anchor = path.concat(text.length);
        draft.selection.focus = path.concat(text.length);
      } else {
        // Update selection to match added text. This is probably not good enough
        // for mobile devices.
        const offset = text.length - currentChild.text.length;
        draft.selection.anchor[draft.selection.anchor.length - 1] += offset;
        draft.selection.focus[draft.selection.focus.length - 1] += offset;
      }
      return;
    }

    case 'onParentEditorStateChange': {
      Object.keys(action.change).forEach(prop => {
        // @ts-ignore Pull request please.
        draft[prop] = action.change[prop];
      });
      return;
    }

    default:
      return assertNever(action);
  }
});
