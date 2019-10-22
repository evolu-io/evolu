import nanoid from 'nanoid';
import { IO } from 'fp-ts/lib/IO';
import { Newtype, iso } from 'newtype-ts';

/**
 * NodeID is string created with nanoid.
 */
export interface NodeID
  extends Newtype<{ readonly NodeID: unique symbol }, string> {}

const isoNodeID = iso<NodeID>();

export const mapNodeIDToString = (nodeID: NodeID): string =>
  isoNodeID.unwrap(nodeID);

export const id: IO<NodeID> = () => isoNodeID.wrap(nanoid());

export interface Node {
  readonly id: NodeID;
}
