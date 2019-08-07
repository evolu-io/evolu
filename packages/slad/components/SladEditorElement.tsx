import React, { ReactNode, Fragment, useMemo } from 'react';
import { SladText, SladEditorText } from './SladEditorText';
import { useGetReferenceKey } from '../hooks/useGetReferenceKey';
import { SladPath } from './SladEditorSetNodePathContext';
import {
  SladEditorSetNodePathRef,
  useSladEditorSetNodePathRef,
} from '../hooks/useSladEditorSetNodePathRef';
import { useMemoPath } from '../hooks/useMemoPath';

export type SladElementDefaultProps = React.HTMLAttributes<HTMLDivElement>;

export type SladElement<Props = SladElementDefaultProps> = Readonly<{
  props: Props;
  children: readonly (SladElement<Props> | SladText)[];
}>;

export type RenderElement<Props = SladElementDefaultProps> = (
  props: Props,
  children: ReactNode,
  ref: SladEditorSetNodePathRef,
) => ReactNode;

export interface SladEditorElementProps<Props = SladElementDefaultProps> {
  element: SladElement<Props>;
  renderElement: RenderElement<Props> | undefined;
  path: SladPath;
}

export const isSladText = (x: SladElement | SladText): x is SladText => {
  return 'type' in x && x.type === 'text';
};

const renderDefaultElement: RenderElement = (props, children, ref) => {
  return (
    <div {...props} ref={ref}>
      {children}
    </div>
  );
};

export function SladEditorElement<Props = SladElementDefaultProps>({
  element,
  renderElement,
  path,
}: SladEditorElementProps<Props>): JSX.Element {
  const getReferenceKey = useGetReferenceKey();
  const memoPath = useMemoPath(path);

  const children = useMemo(() => {
    return element.children.map((child, index) => {
      const key = getReferenceKey(child);
      const childPath = [...memoPath, index];
      return (
        <Fragment key={key}>
          {isSladText(child) ? (
            <SladEditorText text={child} path={childPath} />
          ) : (
            <SladEditorElement
              element={child}
              renderElement={renderElement}
              path={childPath}
            />
          )}
        </Fragment>
      );
    });
  }, [element.children, getReferenceKey, memoPath, renderElement]);

  const sladEditorSetNodePathRef = useSladEditorSetNodePathRef(memoPath);

  return useMemo(() => {
    return (
      <>
        {(renderElement || renderDefaultElement)(
          element.props,
          children,
          sladEditorSetNodePathRef,
        )}
      </>
    );
  }, [children, element.props, renderElement, sladEditorSetNodePathRef]);
}
