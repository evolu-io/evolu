import { assertNever } from 'assert-never';
import produce, { Draft } from 'immer';
import { Reducer } from 'react';
import { EditorElement, getParentElementByPath } from '../models/element';
import { EditorState } from '../models/state';
import {
  EditorSelection,
  editorSelectionsAreEqual,
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
  | { type: 'onParentElementChange'; element: EditorElement }
  | { type: 'onParentHasFocusChange'; hasFocus: boolean }
  | { type: 'onParentSelectionChange'; selection: EditorSelection | null };

export const editorReducer: Reducer<
  EditorState<EditorElement>,
  EditorAction
> = (state, action) => {
  switch (action.type) {
    case 'onFocus': {
      return { ...state, hasFocus: true };
    }
    case 'onBlur': {
      return { ...state, hasFocus: false };
    }
    case 'onSelectionChange': {
      // Note we are using produce per action. That's how Immer should be used.
      // Produce for the whole reducer is possible but I don't know how to type it.
      return produce(state, draft => {
        const { selection } = action;
        if (editorSelectionsAreEqual(selection, draft.selection)) return;
        draft.selection = selection as Draft<EditorSelection>;
      });
    }
    case 'onTextChange': {
      return produce(state, draft => {
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
          // This is probably not good enough for mobiles.
          const offset = text.length - currentChild.text.length;
          draft.selection.anchor[draft.selection.anchor.length - 1] += offset;
          draft.selection.focus[draft.selection.focus.length - 1] += offset;
        }
      });
    }
    case 'onParentElementChange': {
      if (action.element === state.element) return state;
      return { ...state, element: action.element };
    }
    case 'onParentHasFocusChange': {
      if (action.hasFocus === state.hasFocus) return state;
      return { ...state, hasFocus: action.hasFocus };
    }
    case 'onParentSelectionChange': {
      if (editorSelectionsAreEqual(action.selection, state.selection))
        return state;
      return { ...state, selection: action.selection };
    }
    default:
      return assertNever(action);
  }
};
