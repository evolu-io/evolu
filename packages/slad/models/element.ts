/**
 * SladElement is the most general base interface from which all elements inherit.
 * It only has properties common to all kinds of elements.
 */
export interface SladElement {
  readonly children?: readonly (SladElement | string)[] | undefined;
}

/**
 * SladDivElement has React div element.
 */
export interface SladDivElement extends SladElement {
  props: React.HTMLAttributes<HTMLDivElement>;
  children?: (SladDivElement | string)[] | undefined;
}
