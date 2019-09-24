import { assertNever } from 'assert-never';
import produce, { Draft } from 'immer';
import { Reducer } from 'react';
import { EditorElement } from '../models/element';
import {
  EditorSelection,
  editorSelectionsAreEqual,
  invariantEditorSelectionIsDefined,
} from '../models/selection';
import { EditorState, insertText } from '../models/state';

// TODO: Enforce actions are side effects free aka action can not contain DOM nodes
// or anything else than plain JSON.
// With TypeScript 3.7, we will be able to leverage this recursive syntax:
// type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
// type EditorActionBase = object with string type and json object props only.
// type NoSideEffects<T extends EditorActionBase> = T;
// export type EditorAction = NoSideEffects<
// https://github.com/microsoft/TypeScript/pull/33050
export type EditorAction =
  | { type: 'focus' }
  | { type: 'blur' }
  | { type: 'selectionChange'; selection: EditorSelection | null }
  | {
      type: 'setEditorStatePartial';
      change: Partial<EditorState<EditorElement>>;
    }
  // beforeinput actions
  | { type: 'insertText'; text: string }
  | { type: 'deleteContent'; selection: EditorSelection };

export type EditorReducer<T extends EditorElement = EditorElement> = Reducer<
  EditorState<T>,
  EditorAction
>;

/**
 * Create editor reducer from Immer producer.
 */
export function createEditorReducer<T extends EditorElement = EditorElement>(
  producer: (
    draft: Draft<EditorState<T>>,
    action: EditorAction,
  ) => Draft<EditorState<T>> | void,
): EditorReducer<T> {
  return produce(producer) as EditorReducer<T>;
}

export const editorReducer = createEditorReducer((draft, action) => {
  switch (action.type) {
    case 'focus':
      draft.hasFocus = true;
      return;

    case 'blur':
      draft.hasFocus = false;
      return;

    case 'selectionChange':
      if (editorSelectionsAreEqual(action.selection, draft.selection)) return;
      draft.selection = action.selection as Draft<EditorSelection>;
      return;

    case 'setEditorStatePartial':
      Object.keys(action.change).forEach(prop => {
        // @ts-ignore TODO: Fix it.
        draft[prop] = action.change[prop as keyof EditorState];
      });
      return;

    case 'insertText':
      if (!invariantEditorSelectionIsDefined(draft.selection)) return;
      return insertText(action.text, draft.selection)(draft);

    case 'deleteContent':
      // deleteContent(selection)(draft)
      // console.log(action.selection);

      return;

    default:
      return assertNever(action);
  }
});
