import { Predicate, Refinement } from 'fp-ts/lib/function';
import { Node, Text } from '../types';
import { stringIsBR } from './string';

export const isText: Refinement<Node, Text> = (node): node is Text =>
  typeof (node as Text).text === 'string';

export const textIsBR: Predicate<Text> = text => stringIsBR(text.text);
