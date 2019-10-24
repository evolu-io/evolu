import { IO } from 'fp-ts/lib/IO';
import nanoid from 'nanoid';
import { iso } from 'newtype-ts';
import { NodeID } from '../types';

const isoNodeID = iso<NodeID>();

export const mapNodeIDToString = (nodeID: NodeID): string =>
  isoNodeID.unwrap(nodeID);

export const id: IO<NodeID> = () => isoNodeID.wrap(nanoid());
