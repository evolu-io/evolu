import { empty, isNonEmpty } from 'fp-ts/lib/Array';
import { absurd, constVoid } from 'fp-ts/lib/function';
import { snoc } from 'fp-ts/lib/NonEmptyArray';
import { geq } from 'fp-ts/lib/Ord';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Option';
import { Element, Info, Node, NodeInfo, Path, Selection } from '../types';
import { isElement } from './element';
import { selectionToRange } from './selection';
import { byContains, toPathIndex } from './path';
import { isText } from './text';

type SearchingFor = 'start' | 'end' | 'nothing';

// TODO: Measure then optimize via memoization.
export const createInfo = (selection: Selection, element: Element): Info => {
  let sf: SearchingFor = 'start';
  const range = selectionToRange(selection);
  const nodes: NodeInfo[] = [];

  const walk = (node: Node, path: Path) => {
    if (isNonEmpty(path)) {
      switch (sf) {
        case 'start': {
          // console.log(path, range.start);
          if (isText(node) && geq(byContains)(path, range.start)) {
            // sf = 'end';
            sf = 'nothing';
          }
          break;
        }
        case 'end':
          if (geq(byContains)(path, range.end)) sf = 'nothing';
          break;
        case 'nothing':
          return;
        default:
          absurd(sf);
      }
      const selected = sf === 'end' || sf === 'nothing';

      if (selected) {
        nodes.push({ node, path });
      }
    }

    if (sf === 'nothing' || !isElement(node)) return;
    node.children.forEach((nodeChild, index) => {
      if (sf === 'nothing') return;
      pipe(
        toPathIndex(index),
        fold(constVoid, index => {
          walk(nodeChild, snoc(path, index));
        }),
      );
    });
  };

  walk(element, empty);

  // eslint-disable-next-line no-console
  // console.log(JSON.stringify(nodes));

  return {
    // selection,
    // range,
    nodes,
  };
};
