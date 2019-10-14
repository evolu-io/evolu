/* eslint-env browser */
import React, { Component, memo } from 'react';
import { findDOMNode } from 'react-dom';
import { useSetNodeEditorPathRef } from '../hooks/useSetNodeEditorPathRef';
import { EditorPath, eqEditorPath } from '../models/path';
import { textIsBR } from '../models/text';
import { SetNodeEditorPathRef } from '../models/node';

// Inspired by DraftEditorTextNode.
// As for findDOMNode in strict mode:
//  https://twitter.com/steida/status/1177610944106651653
//  https://github.com/facebook/react/blob/master/packages/react-dom/src/__tests__/ReactDOMFiber-test.js#L92

// We need this to get text node without a wrapper.
class TextNode extends Component<{ children: string }> {
  render() {
    return this.props.children;
  }
}

interface EditorTextNodeProps {
  children: string;
  setNodeEditorPathRef: SetNodeEditorPathRef;
}

class EditorTextNode extends Component<EditorTextNodeProps> {
  forceFlag: boolean;

  node: Text | HTMLBRElement | null;

  constructor(props: EditorTextNodeProps) {
    super(props);
    this.forceFlag = false;
    this.node = null;
  }

  componentDidMount() {
    this.forceFlag = !this.forceFlag;
  }

  shouldComponentUpdate(nextProps: EditorTextNodeProps) {
    const { node } = this;
    const shouldBeBR = textIsBR(nextProps.children);
    if (shouldBeBR) {
      return (node as HTMLBRElement).tagName !== 'BR';
    }
    return (node as HTMLBRElement | Text).textContent !== nextProps.children;
  }

  componentDidUpdate() {
    this.forceFlag = !this.forceFlag;
  }

  render() {
    const { setNodeEditorPathRef } = this.props;
    const forceFlagKey = this.forceFlag ? 'A' : 'B';
    if (textIsBR(this.props.children)) {
      return (
        <br
          key={forceFlagKey}
          ref={(node: HTMLBRElement | null) => {
            this.node = node;
            setNodeEditorPathRef(node);
          }}
        />
      );
    }
    return (
      <TextNode
        key={forceFlagKey}
        ref={(instance: TextNode | null) => {
          // https://twitter.com/steida/status/1177610944106651653
          // eslint-disable-next-line react/no-find-dom-node
          const node = findDOMNode(instance) as Text | null;
          this.node = node;
          setNodeEditorPathRef(node);
        }}
      >
        {this.props.children}
      </TextNode>
    );
  }
}

export interface EditorTextRendererProps {
  text: string;
  path: EditorPath;
}

export const EditorTextRenderer = memo<EditorTextRendererProps>(
  ({ text, path }) => {
    const setNodeEditorPathRef = useSetNodeEditorPathRef(path);
    return (
      <EditorTextNode setNodeEditorPathRef={setNodeEditorPathRef}>
        {text}
      </EditorTextNode>
    );
  },
  (prevProps, nextProps) => {
    if (!eqEditorPath.equals(prevProps.path, nextProps.path)) return false;
    if (prevProps.text !== nextProps.text) return false;
    return true;
  },
);

EditorTextRenderer.displayName = 'EditorTextRenderer';
