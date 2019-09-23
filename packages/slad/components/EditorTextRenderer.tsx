import React, { Component, memo, useCallback } from 'react';
import { findDOMNode } from 'react-dom';
import { useSetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorPath, editorPathsAreEqual } from '../models/path';

/**
 * Text is rendered via Component with findDOMNode to get text node reference.
 * https://github.com/facebook/react/blob/master/packages/react-dom/src/__tests__/ReactDOMFiber-test.js#L92
 */
class TextNode extends Component<{ text: string }> {
  render() {
    return this.props.text;
  }
}

export interface EditorTextRendererProps {
  text: string;
  path: EditorPath;
}

export const EditorTextRenderer = memo<EditorTextRendererProps>(
  ({ text, path }) => {
    const setNodePathRef = useSetNodeEditorPathRef(path);

    const handleBRRef = useCallback(
      (node: HTMLBRElement | null) => {
        setNodePathRef(node);
      },
      [setNodePathRef],
    );

    const handleTextNodeRef = useCallback(
      (instance: TextNode | null) => {
        // eslint-disable-next-line react/no-find-dom-node
        const text = findDOMNode(instance) as Text | null;
        setNodePathRef(text);
      },
      [setNodePathRef],
    );

    return text.length === 0 ? (
      <br ref={handleBRRef} />
    ) : (
      <TextNode text={text} ref={handleTextNodeRef} />
    );
  },
  (prevProps, nextProps) => {
    if (!editorPathsAreEqual(prevProps.path, nextProps.path)) return false;
    if (prevProps.text !== nextProps.text) return false;
    return true;
  },
);

EditorTextRenderer.displayName = 'EditorTextRenderer';
