import { Predicate, Refinement } from 'fp-ts/lib/function';
import { Node, Text } from '../types';
import { stringIsBR } from './string';

export const isText: Refinement<Node, Text> = (u): u is Text =>
  typeof (u as Text).text === 'string';

export const textIsBR: Predicate<Text> = text => stringIsBR(text.text);
