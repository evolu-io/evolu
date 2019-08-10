import React, { Component, useCallback, memo } from 'react';
import ReactDOM from 'react-dom';
import { SladPath } from './SladEditorSetNodePathContext';
import { useSladEditorSetNodePathRef } from '../hooks/useSladEditorSetNodePathRef';

// Yes, we use Component and findDOMNode because it's the only way how
// we can get TextNode DOM reference with React.
// Otherwise, we would have to traverse DOM which would be slower and error-prone.
// We don't want to wrap text because that would mess DOM.
// https://github.com/facebook/react/blob/master/packages/react-dom/src/__tests__/ReactDOMFiber-test.js#L92
// Check: 'finds the DOM Text node of a string child'
class TextNode extends Component<{ value: string }> {
  render() {
    const { value } = this.props;
    return value;
  }
}

export interface SladEditorTextProps {
  value: string;
  path: SladPath;
}

export const SladEditorText = memo<SladEditorTextProps>(
  function SladEditorText({ value, path }) {
    const sladEditorSetNodePathRef = useSladEditorSetNodePathRef(path);

    const handleRef = useCallback(
      (instance: TextNode) => {
        // We know it can return Text or null only.
        // eslint-disable-next-line react/no-find-dom-node
        const textNode = ReactDOM.findDOMNode(instance) as Text | null;
        sladEditorSetNodePathRef(textNode);
      },
      [sladEditorSetNodePathRef],
    );

    return <TextNode value={value} ref={handleRef} />;
  },
);
