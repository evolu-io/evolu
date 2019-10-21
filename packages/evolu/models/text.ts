import { Predicate, Refinement } from 'fp-ts/lib/function';
import { Node } from './node';
import { stringIsBR } from './string';

/**
 * Editor text. Empty string is rendered as BR.
 */
export interface Text extends Node {
  readonly text: string;
}

export const isText: Refinement<Node, Text> = (u): u is Text =>
  typeof (u as Text).text === 'string';

export const textIsBR: Predicate<Text> = text => stringIsBR(text.text);
