import { Predicate, Refinement } from 'fp-ts/lib/function';
import { Node, Text } from '../types';
import { stringIsBR } from './string';

export const isText: Refinement<Node, Text> = (node): node is Text =>
  typeof node === 'string';

export const textIsBR: Predicate<Text> = text => stringIsBR(text);

export const isTextNotBR: Refinement<Node, Text> = (child): child is Text =>
  isText(child) && !textIsBR(child);

export const makeKeyForText = (text: Text, index: number): string =>
  `${text}-${index}`;
