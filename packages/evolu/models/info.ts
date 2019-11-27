import { Info, NodeInfo, Selection, Element } from '../types';

type SearchingFor = 'start' | 'end' | 'nothing';

// TODO: Measure then optimize via memoization.
export const createInfo = (selection: Selection, element: Element): Info => {
  // eslint-disable-next-line no-console
  console.log(selection);
  // eslint-disable-next-line no-console
  console.log(element);
  // let sf: SearchingFor = 'start';
  // const range = selectionToRange(selection);
  const nodes: NodeInfo[] = [];

  // const walk = (node: Node, path: Path) => {
  //   if (isNonEmpty(path)) {
  //     switch (sf) {
  //       case 'start': {
  //         // console.log(path, range.start);
  //         if (isText(node) && geq(byContains)(path, range.start)) {
  //           // sf = 'end';
  //           sf = 'nothing';
  //         }
  //         break;
  //       }
  //       case 'end':
  //         if (geq(byContains)(path, range.end)) sf = 'nothing';
  //         break;
  //       case 'nothing':
  //         return;
  //       default:
  //         absurd(sf);
  //     }
  //     const selected = sf === 'end' || sf === 'nothing';

  //     if (selected) {
  //       nodes.push({ node, path });
  //     }
  //   }

  //   if (sf === 'nothing' || !isElement(node)) return;
  //   node.children.forEach((nodeChild, index) => {
  //     if (sf === 'nothing') return;
  //     pipe(
  //       toPathIndex(index),
  //       fold(constVoid, index => {
  //         walk(nodeChild, snoc(path, index));
  //       }),
  //     );
  //   });
  // };

  // walk(element, empty);

  // eslint-disable-next-line no-console
  // console.log(JSON.stringify(nodes));

  return {
    // selection,
    // range,
    nodes,
  };
};
