import React, {
  Component,
  memo,
  RefObject,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { findDOMNode } from 'react-dom';
import invariant from 'tiny-invariant';
import { useSetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorPath, editorPathsAreEqual, lastIndex } from '../models/path';
import { textIsBR } from '../models/text';

// Inspired by DraftEditorTextNode, but redesigned for our purposes.

class EditorTextNode extends Component<{ text: string }> {
  render() {
    return this.props.text;
  }
}

export interface EditorTextRendererProps {
  text: string;
  path: EditorPath;
  // We don't have any "point" to DOM, because text node can be replaced with
  // BR, so we have to use parent element ref and path last index.
  parentRef: RefObject<HTMLElement>;
}

export const EditorTextRenderer = memo<EditorTextRendererProps>(
  ({ text, path, parentRef }) => {
    const setNodePathRef = useSetNodeEditorPathRef(path);

    // That's how we control useMemo reset to avoid re-rendering.
    const textToRenderRef = useRef(text);

    // Because we control rendering after the initial render, React can't know
    // the actual DOM state. Therefore, when we allow re-rendering, we have to
    // force React to remount every time it rerenders via React keys.
    const forceFlagRef = useRef(false);
    // Maybe useEffect would be enough because we do not read from DOM,
    // but useLayoutEffect has the same behavior like componentDidUpdate,
    // so do not experiment rather.
    useLayoutEffect(() => {
      forceFlagRef.current = !forceFlagRef.current;
    });

    // It's like shouldComponentUpdate, but in render.
    // We know it's update because parentRef was already rendered.
    if (parentRef.current) {
      // We have to read from DOM via parent ref because text node
      // can be replaced with BR and vice versa.
      const node = parentRef.current.childNodes[lastIndex(path)];
      invariant(
        // eslint-disable-next-line no-undef
        node instanceof HTMLBRElement || node instanceof Text,
        'node is not an HTMLBRElement nor a Text',
      );

      // DraftEditorTextNode shouldComponentUpdate logic.
      // It seems it's weird to use textContent on BR, which returns
      // an empty string (because of no children), and on Text, which returns
      // nodeValue which returns data, but it's OK. Just little hard to read,
      // because it looks like it does not check vice versa mode aka
      // shouldNotBeNewline while it is a new line. But because BR textContent
      // is always an empty string and text is not because checked before, it's ok.
      // https://git.io/JeZ4R
      // https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent
      // https://stackoverflow.com/a/12287159/233902
      // shouldComponentUpdate(nextProps: Props): boolean {
      //   const node = this._node;
      //   const shouldBeNewline = nextProps.children === '';
      //   invariant(node instanceof Element, 'node is not an Element');
      //   if (shouldBeNewline) {
      //     return !isNewline(node);
      //   }
      //   return node.textContent !== nextProps.children;
      // }
      const shouldComponentUpdate = textIsBR(text)
        ? node.nodeName !== 'BR'
        : node.textContent !== text;

      console.log(shouldComponentUpdate);
      console.log(node);

      if (shouldComponentUpdate) {
        // Force re-render because of model change. We know, because DOM is stale.
        textToRenderRef.current = text;
      } else {
        // If DOM is already updated because of IME, we only setNodePathRef.
        // Cast, because childNodes returns ChildNode type.
        setNodePathRef(node as HTMLBRElement | Text);
      }
    }

    const { current: textToRender } = textToRenderRef;

    // "Conveniently, useMemo also lets you skip an expensive re-render of a child"
    // https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-shouldcomponentupdate
    return useMemo(() => {
      const forceFlagKey = forceFlagRef.current ? 'a' : 'b';
      if (textIsBR(textToRender))
        return (
          <br
            key={forceFlagKey}
            ref={(node: HTMLBRElement | null) => {
              setNodePathRef(node);
            }}
          />
        );
      return (
        <EditorTextNode
          key={forceFlagKey}
          text={textToRender}
          ref={(instance: EditorTextNode | null) => {
            // As for findDOMNode in strict mode:
            // https://twitter.com/steida/status/1177610944106651653
            // https://github.com/facebook/react/blob/master/packages/react-dom/src/__tests__/ReactDOMFiber-test.js#L92
            // eslint-disable-next-line react/no-find-dom-node
            const textNode = findDOMNode(instance) as Text | null;
            setNodePathRef(textNode);
          }}
        />
      );
    }, [textToRender, setNodePathRef]);
  },
  (prevProps, nextProps) => {
    if (!editorPathsAreEqual(prevProps.path, nextProps.path)) return false;
    if (prevProps.text !== nextProps.text) return false;
    return true;
  },
);

EditorTextRenderer.displayName = 'EditorTextRenderer';
