/* eslint-env browser */
import React, { Component, memo } from 'react';
import { findDOMNode } from 'react-dom';
import { useSetDOMNodePathRef } from '../hooks/useSetDOMNodePathRef';
import { Path, eqPath } from '../models/path';
import { SetDOMNodePathRef, DOMText } from '../models/dom';
import { stringIsBR } from '../models/string';

// Inspired by DraftEditorTextNode.

class TextNode extends Component<{ children: string }> {
  render() {
    return this.props.children;
  }
}

interface TextProps {
  children: string;
  setNodePathRef: SetDOMNodePathRef;
}

class Text extends Component<TextProps> {
  forceFlag: boolean;

  node: DOMText | HTMLBRElement | null;

  constructor(props: TextProps) {
    super(props);
    this.forceFlag = false;
    this.node = null;
  }

  componentDidMount() {
    this.forceFlag = !this.forceFlag;
  }

  shouldComponentUpdate(nextProps: TextProps) {
    const { node } = this;
    const shouldBeBR = stringIsBR(nextProps.children);
    if (shouldBeBR) {
      return (node as HTMLBRElement).tagName !== 'BR';
    }
    return (node as HTMLBRElement | DOMText).textContent !== nextProps.children;
  }

  componentDidUpdate() {
    this.forceFlag = !this.forceFlag;
  }

  render() {
    const { setNodePathRef } = this.props;
    const forceFlagKey = this.forceFlag ? 'A' : 'B';
    if (stringIsBR(this.props.children)) {
      return (
        <br
          key={forceFlagKey}
          ref={(node: HTMLBRElement | null) => {
            this.node = node;
            setNodePathRef(node);
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
          const node = findDOMNode(instance) as DOMText | null;
          this.node = node;
          setNodePathRef(node);
        }}
      >
        {this.props.children}
      </TextNode>
    );
  }
}

export interface TextRendererProps {
  text: string;
  path: Path;
}

export const TextRenderer = memo<TextRendererProps>(
  ({ text, path }) => {
    const setNodePathRef = useSetDOMNodePathRef(path);
    return (
      <Text
        // Reset when a path has been changed to enforce setNodePathRef update.
        key={path.join()}
        setNodePathRef={setNodePathRef}
      >
        {text}
      </Text>
    );
  },
  (prevProps, nextProps) => {
    if (!eqPath.equals(prevProps.path, nextProps.path)) return false;
    if (prevProps.text !== nextProps.text) return false;
    return true;
  },
);

TextRenderer.displayName = 'TextRenderer';
