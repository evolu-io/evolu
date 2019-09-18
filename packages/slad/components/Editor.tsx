import React, { useState, useEffect } from 'react';
import { EditorElement } from '../models/element';
import { EditorClientProps, EditorClient } from './EditorClient';
import { EditorServer } from './EditorServer';

export function Editor<T extends EditorElement>({
  editorState,
  onChange,
  renderElement,
  editorReducer,
  className,
  id,
  style,
  ...rest
}: EditorClientProps<T>) {
  const [renderClient, setRenderClient] = useState(false);

  // Note we render EditorServer both on the server and the client,
  // and after then, we render EditorClient.
  // That's because EditorClient uses useLayoutEffect and some other logic
  // which is unnecessary on the server.
  // The advantage of this approach is that server renderer HTML is not
  // editable until JavaScript is downloaded and parsed.
  // Also, the initial render is faster and not blocking the other components.
  // contentEditable related props are rendered only with EditorClient.
  // Not editable webs can use EditorServer only.
  // https://github.com/facebook/react/issues/14927
  useEffect(() => {
    setRenderClient(true);
  }, []);

  if (!renderClient)
    return (
      <EditorServer
        element={editorState.element}
        renderElement={renderElement}
        className={className}
        id={id}
        style={style}
      />
    );

  return (
    <EditorClient
      {...{
        editorState,
        onChange,
        renderElement,
        editorReducer,
        className,
        id,
        style,
        ...rest,
      }}
    />
  );
}
