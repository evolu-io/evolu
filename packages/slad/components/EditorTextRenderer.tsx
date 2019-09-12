import React, {
  Component,
  memo,
  useRef,
  MutableRefObject,
  // useEffect,
} from 'react';
import { findDOMNode } from 'react-dom';
import { useSetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorPath, editorPathsAreEqual } from '../models/path';

/**
 * Text is rendered via Component with findDOMNode, because it's the only way
 * to get text node reference.
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
  parentElementRef: MutableRefObject<Node | null>;
}

/**
 * EditorTextRenderer does everything imperatively, except the initial render,
 * because underlying DOM can be changed out of the React.
 * https://github.com/facebook/react/issues/13396#issuecomment-413550980
 * https://github.com/facebook/draft-js/blob/dc58df8219fdc1e12ce947877d103b595682efa9/src/component/contents/DraftEditorTextNode.react.js#L33
 */
export const EditorTextRenderer = memo<EditorTextRendererProps>(
  ({ text, path, parentElementRef }) => {
    const setNodePathRef = useSetNodeEditorPathRef(path);
    const initialNodeRef = useRef<Node | null>(null);

    if (parentElementRef.current) {
      const index = path[path.length - 1];
      const domNode = parentElementRef.current.childNodes[index];
      const domNodeIsBR = domNode.nodeName === 'BR';
      const textIsBR = text.length === 0;
      // console.log(textIsBR, domNodeIsBR);

      if (textIsBR) {
        if (domNodeIsBR) {
          // Ensure ref when user delete text so browser injects BR instead.
          setNodePathRef(domNode as HTMLBRElement);
        } else {
          if (domNode.parentNode && domNode.ownerDocument) {
            const br = domNode.ownerDocument.createElement('br');
            domNode.parentNode.replaceChild(br, domNode);
            setNodePathRef(br);
          }
        }
      } else {
        if (domNodeIsBR) {
          // TODO: Handle model change.
        } else {
          // Update DOM if necessary.
          if (text !== domNode.nodeValue) domNode.nodeValue = text;
        }
      }
    }

    // TODO: setNodePathRef null for remove on last path, maybe.
    // Maybe it's task for mutation observer.

    // This is how we skip every next render.
    // https://reactjs.org/docs/integrating-with-other-libraries.html#integrating-with-dom-manipulation-plugins
    const initialRenderRef = useRef<JSX.Element | null>(null);
    if (initialRenderRef.current == null) {
      initialRenderRef.current =
        text.length === 0 ? (
          <br
            ref={node => {
              // Do not remove because path can be updated.
              if (node == null) return;
              if (initialNodeRef.current == null) initialNodeRef.current = node;
              setNodePathRef(node);
            }}
          />
        ) : (
          <TextNode
            text={text}
            ref={instance => {
              // Do not remove because path can be updated.
              if (instance == null) return;
              // eslint-disable-next-line react/no-find-dom-node
              const text = findDOMNode(instance) as Text | null;
              if (initialNodeRef.current == null) initialNodeRef.current = text;
              setNodePathRef(text);
            }}
          />
        );
    }

    return <>{initialRenderRef.current}</>;
  },
  (prevProps, nextProps) => {
    if (!editorPathsAreEqual(prevProps.path, nextProps.path)) return false;
    if (prevProps.text !== nextProps.text) return false;
    return true;
  },
);

EditorTextRenderer.displayName = 'EditorTextRenderer';
