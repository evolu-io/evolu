import css from 'styled-jsx/css';
import { useCallback } from 'react';
import { StandardPropertiesHyphen } from 'csstype';

// Leverage styled-jsx for custom style rendering.
export function useStyledJsx() {
  // TODO: Maybe cache resolved styles with WeakMap, but do we need it?
  const getStyledJsx = useCallback((style: StandardPropertiesHyphen) => {
    const styleString = Object.keys(style)
      .reduce<string[]>((array, prop) => {
        const value = style[prop as keyof StandardPropertiesHyphen];
        return [...array, `${prop}: ${value}`];
      }, [])
      .join(';');
    // css.resolve does not add vendor prefixes, but that's fine,
    // modern browsers don't need them.
    return css.resolve`
      ${styleString}
    `;
  }, []);
  return getStyledJsx;
}
