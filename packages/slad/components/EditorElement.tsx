import React, { Fragment, memo, useMemo, useContext } from 'react';
import { useGetReferenceKey } from '../hooks/useGetReferenceKey';
import { useSetNodePathRef } from '../hooks/useSetNodePathRef';
import { EditorText } from './EditorText';
import { RenderElementContext } from '../contexts/RenderElementContext';
import { Element } from '../models/element';
import { Path } from '../models/path';

export interface EditorElementProps {
  element: Element;
  path: Path;
}

export const EditorElement = memo<EditorElementProps>(function EditorElement({
  element,
  path,
}) {
  const getReferenceKey = useGetReferenceKey();
  const renderElement = useContext(RenderElementContext);
  const setNodePathRef = useSetNodePathRef(path);

  const children = useMemo(() => {
    return (
      element.children &&
      element.children.map((child, index) => {
        const key = getReferenceKey(child, index);
        const childPath: Path = [...path, index];
        return (
          <Fragment key={key}>
            {typeof child === 'string' ? (
              <EditorText value={child} path={childPath} />
            ) : (
              <EditorElement element={child} path={childPath} />
            )}
          </Fragment>
        );
      })
    );
  }, [element.children, getReferenceKey, path]);

  return <>{renderElement(element, children, setNodePathRef)}</>;
});
