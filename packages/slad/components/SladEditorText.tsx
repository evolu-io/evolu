import React, { Component, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { SladPath } from './SladEditorSetNodePathContext';
import { useSladEditorSetNodePathRef } from '../hooks/useSladEditorSetNodePathRef';
import { useMemoPath } from '../hooks/useMemoPath';

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

export type SladText = Readonly<{
  type: 'text';
  value: string;
}>;

interface SladEditorTextProps {
  text: SladText;
  path: SladPath;
}

export function SladEditorText({
  text,
  path,
}: SladEditorTextProps): JSX.Element {
  const memoPath = useMemoPath(path);
  const sladEditorSetNodePathRef = useSladEditorSetNodePathRef(memoPath);

  const handleRef = useCallback(
    (instance: TextNode) => {
      // We know it can return Text or null only.
      // eslint-disable-next-line react/no-find-dom-node
      const textNode = ReactDOM.findDOMNode(instance) as Text | null;
      sladEditorSetNodePathRef(textNode);
    },
    [sladEditorSetNodePathRef],
  );

  return useMemo(() => {
    return <TextNode value={text.value} ref={handleRef} />;
  }, [handleRef, text.value]);
}
