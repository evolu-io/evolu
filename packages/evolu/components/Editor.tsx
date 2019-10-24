import React, { useState, useEffect, memo } from 'react';
import { EditorClient } from './EditorClient';
import { EditorServer } from './EditorServer';
import { EditorClientProps } from '../types';

export const Editor = memo<EditorClientProps>(props => {
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
        element={props.value.element}
        renderElement={props.renderElement}
        className={props.className}
        id={props.id}
        style={props.style}
      />
    );

  return <EditorClient {...props} />;
});

Editor.displayName = 'Editor';
