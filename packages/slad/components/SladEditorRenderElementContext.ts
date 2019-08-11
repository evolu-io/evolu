import { createContext, ReactNode } from 'react';
import { SladEditorSetNodePathRef } from '../hooks/useSladEditorSetNodePathRef';

/**
 * SladElement is the most general base interface from which all interfaces inherit.
 * It only has properties common to all kinds of elements.
 */
export interface SladElement {
  readonly children?: readonly (SladElement | string)[] | undefined;
}

// For nice DX, renderElement element arg is an union of all nested elements.
// Unfortunately, infinite recursion is not possible with TypeScript.
// To be precise, it's possible for recreated trees (that's how DeepReadonly or
// Immutable types work), or via hack:
// https://medium.com/@michael.a.hensler/why-be-finite-when-you-can-be-infinite-e84d82865074
// But that hack should not be used:
// https://github.com/Microsoft/TypeScript/issues/24016#issuecomment-428745727
// https://stackoverflow.com/questions/51480502/recursive-version-of-unpackedt-in-typescript/51481332#51481332
// Nevermind, finite recursion is good enough for most cases.
// For really elbow deep nesting..., I bet custom renderElement can be used.
// Or something like https://github.com/dsherret/ts-morph
// Feel free to send PR.
type OmitString<T> = T extends string ? never : T;
type UnionFromAray<T> = T extends (infer U)[] ? OmitString<U> : never;
type UnionFromElementAndItsChildren<T extends SladElement> =
  | T
  | UnionFromAray<T['children']>;
// For reason beyond my imagination, UnionFromElementAndItsChildren must be aliased,
// otherwise 'Union<Union<Union<T>>>' does not work.
// ..
type Union<T> = UnionFromElementAndItsChildren<T>;
// Max allowed nesting, otherwise:
// "Type instantiation is excessively deep and possibly infinite.ts(2589)"
// But it can even enlarged somehow:
// https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
// But I am pretty sure 6 is good enough.
type DeepFiniteNestedUnion<T> = Union<Union<Union<Union<Union<Union<T>>>>>>;

export type RenderElement<T extends SladElement> = (
  element: DeepFiniteNestedUnion<T>,
  children: ReactNode,
  ref: SladEditorSetNodePathRef,
) => ReactNode;

// Through the context, we pass the most general element, the SladElement.
// React context value can't be generic, as far as I know.
export const SladEditorRenderElementContext = createContext<
  RenderElement<SladElement>
>(() => null);
