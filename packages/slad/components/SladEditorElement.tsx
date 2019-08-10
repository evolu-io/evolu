import React, { Fragment, memo, useMemo, useContext } from 'react';
import { useGetReferenceKey } from '../hooks/useGetReferenceKey';
import { useSladEditorSetNodePathRef } from '../hooks/useSladEditorSetNodePathRef';
import { SladPath } from './SladEditorSetNodePathContext';
import { SladEditorText } from './SladEditorText';
import {
  SladEditorRenderElementContext,
  SladElement,
} from './SladEditorRenderElementContext';

export interface SladEditorElementProps {
  element: SladElement;
  path: SladPath;
}

export const SladEditorElement = memo<SladEditorElementProps>(
  function SladEditorElement({ element, path }) {
    const getReferenceKey = useGetReferenceKey();
    const renderElement = useContext(SladEditorRenderElementContext);
    const sladEditorSetNodePathRef = useSladEditorSetNodePathRef(path);

    const children = useMemo(() => {
      return (
        element.children &&
        element.children.map((child, index) => {
          const key = getReferenceKey(child, index);
          const childPath: SladPath = [...path, index];
          return (
            <Fragment key={key}>
              {typeof child === 'string' ? (
                <SladEditorText value={child} path={childPath} />
              ) : (
                <SladEditorElement element={child} path={childPath} />
              )}
            </Fragment>
          );
        })
      );
    }, [element.children, getReferenceKey, path]);

    return <>{renderElement(element, children, sladEditorSetNodePathRef)}</>;
  },
);
