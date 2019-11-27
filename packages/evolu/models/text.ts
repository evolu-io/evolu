import { Predicate, Refinement } from 'fp-ts/lib/function';
import { Node, Text } from '../types';
import { stringIsBR } from './string';

// /**
//  * Smart constructor for Text.
//  */
// export const toText = (text: string): Option<Text> =>
//   fromEither(Text.decode(text));

export const isText: Refinement<Node, Text> = (node): node is Text =>
  typeof node === 'string';

export const textIsBR: Predicate<Text> = text => stringIsBR(text);

export const isTextNotBR: Refinement<Node, Text> = (child): child is Text =>
  isText(child) && !textIsBR(child);
