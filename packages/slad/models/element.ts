/**
 * Element is the most general base interface from which all elements inherit.
 * It only has properties common to all kinds of elements.
 */
export interface Element {
  readonly children?: readonly (Element | string)[] | undefined;
}

/**
 * DivElement has props the same as React div element.
 */
export interface DivElement extends Element {
  props: React.HTMLAttributes<HTMLDivElement>;
  children?: (DivElement | string)[] | undefined;
}
