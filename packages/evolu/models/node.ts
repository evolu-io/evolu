import { IO } from 'fp-ts/lib/IO';
import nanoid from 'nanoid';
import { iso } from 'newtype-ts';
import { NodeID } from '../types';

const isoNodeID = iso<NodeID>();

export const nodeIDToString = (nodeID: NodeID): string =>
  isoNodeID.unwrap(nodeID);

// 10 is ok.
// https://zelark.github.io/nano-id-cc/
export const id: IO<NodeID> = () => isoNodeID.wrap(nanoid(10));
