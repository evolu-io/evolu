import React, { PureComponent, useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { SladPath } from './SladEditorSetNodePathContext';
import { useSladEditorSetNodePathRef } from '../hooks/useSladEditorSetNodePathRef';
import { useMemoPath } from '../hooks/useMemoPath';

// Yes, we use PureComponent and findDOMNode because it's the only way
// how we can retrieve TextNode reference via React.
// Otherwise, we would have to traverse DOM which is slower and error-prone.
// We don't want to wrap text with span because that would mess DOM.
// https://github.com/facebook/react/blob/master/packages/react-dom/src/__tests__/ReactDOMFiber-test.js#L92
// Check: 'finds the DOM Text node of a string child'
class TextComponent extends PureComponent<{ text: string }> {
  render() {
    const { text } = this.props;
    return text;
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
    (instance: TextComponent) => {
      // We know it can return Text or null only.
      // eslint-disable-next-line react/no-find-dom-node
      const textNode = ReactDOM.findDOMNode(instance) as Text | null;
      sladEditorSetNodePathRef(textNode);
    },
    [sladEditorSetNodePathRef],
  );

  return useMemo(() => {
    return <TextComponent text={text.value} ref={handleRef} />;
  }, [handleRef, text.value]);
}
