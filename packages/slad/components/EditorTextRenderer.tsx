import React, {
  Component,
  useCallback,
  memo,
  useRef,
  MutableRefObject,
} from 'react';
import { findDOMNode } from 'react-dom';
import { useSetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorPath, editorPathsAreEqual } from '../models/path';

// Text is rendered as plain text node without SPAN wrapper. SPAN is tricky:
// https://github.com/facebook/draft-js/blob/dc58df8219fdc1e12ce947877d103b595682efa9/src/component/contents/DraftEditorTextNode.react.js#L33
// As I manually checked it, DIV is always ok, even with display: inline.

// Component and findDOMNode, because it's the only way how to get DOM Text node reference.
// https://github.com/facebook/react/blob/master/packages/react-dom/src/__tests__/ReactDOMFiber-test.js#L92

interface TextNodeProps {
  text: string;
  textNodeRef: MutableRefObject<Text | null>;
}

class TextNode extends Component<TextNodeProps> {
  shouldComponentUpdate({ text, textNodeRef: { current } }: TextNodeProps) {
    // Do not update component if DOM Text node is already updated.
    // Updating would break native selection.
    // This is the similar logic as in DraftEditorTextNode.
    const domTextIsAlreadyUpdated = current && current.nodeValue === text;
    return !domTextIsAlreadyUpdated;
  }

  render() {
    const { text } = this.props;
    return text;
  }
}

export interface EditorTextRendererProps {
  text: string;
  path: EditorPath;
}

export const EditorTextRenderer = memo<EditorTextRendererProps>(
  ({ text, path }) => {
    const setNodePathRef = useSetNodeEditorPathRef(path);

    const handleHTMLBRElementRef = useCallback(
      (element: HTMLBRElement | null) => {
        setNodePathRef(element);
      },
      [setNodePathRef],
    );

    const textNodeRef = useRef<Text | null>(null);

    const handleTextNodeRef = useCallback(
      (instance: TextNode) => {
        // We know it can return Text or null only.
        // eslint-disable-next-line react/no-find-dom-node
        const text = findDOMNode(instance) as Text | null;
        textNodeRef.current = text;
        setNodePathRef(text);
      },
      [setNodePathRef],
    );

    return text.length === 0 ? (
      <br ref={handleHTMLBRElementRef} />
    ) : (
      <TextNode text={text} ref={handleTextNodeRef} textNodeRef={textNodeRef} />
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.text !== nextProps.text) return false;
    if (!editorPathsAreEqual(prevProps.path, nextProps.path)) return false;
    return true;
  },
);

EditorTextRenderer.displayName = 'EditorTextRenderer';
