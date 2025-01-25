import { DepositTree } from "./depositTree";

export class DepositTreeEncoder {
  // 32 bytes, string
  readonly rootHash: string;

  // 8 bytes, integer
  readonly blockNumber: bigint;

  // 4 bytes, integer
  readonly treeHeight: number;

  // hash of DepositLeaf
  readonly leafHashes: `0x${string}`[];

  constructor(
    rootHash: `0x${string}`,
    blockNumber: bigint,
    treeHeight: number,
    leafHashes: `0x${string}`[],
  ) {
    if (!rootHash.startsWith("0x")) {
      throw new Error("Invalid format of rootHash");
    }
    if (rootHash.length !== 66) {
      throw new Error("Invalid length of rootHash");
    }

    this.rootHash = rootHash;
    this.blockNumber = blockNumber;
    this.treeHeight = treeHeight;
    this.leafHashes = leafHashes;
  }

  static fromDepositTree(tree: DepositTree, blockNumber: bigint): DepositTreeEncoder {
    return new DepositTreeEncoder(
      tree.getMerkleRoot(),
      blockNumber,
      tree.treeHeight,
      tree.getLeafHashes(),
    );
  }

  encode(): ArrayBuffer {
    const numLeafBytes = 32;
    const bufferSize = 52 + this.leafHashes.length * numLeafBytes;

    const view = new DataView(new ArrayBuffer(bufferSize));
    let offset = 0;

    const rootHash = Buffer.from(this.rootHash.slice(2), "hex");
    if (rootHash.length !== 32) {
      throw new Error("Invalid length of rootHash");
    }
    for (let i = 0; i < 32; i++) {
      view.setUint8(offset, rootHash[i]);
      offset += 1;
    }

    view.setBigUint64(offset, this.blockNumber, true);
    offset += 8;

    view.setUint32(offset, this.treeHeight, true);
    offset += 4;

    const numLeaves = BigInt(this.leafHashes.length);
    view.setBigUint64(offset, numLeaves, true);
    offset += 8;

    for (const leafHash of this.leafHashes) {
      const encodedLeaf = new Uint8Array(Buffer.from(leafHash.slice(2), "hex"));
      for (let i = 0; i < encodedLeaf.length; i++) {
        view.setUint8(offset, encodedLeaf[i]);
        offset += 1;
      }
    }

    return view.buffer;
  }

  static decode(buffer: ArrayBuffer): DepositTreeEncoder {
    const numLeafBytes = 32;

    const view = new DataView(buffer);
    let offset = 0;

    const rootHashBuf = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      rootHashBuf[i] = view.getUint8(offset);
      offset += 1;
    }
    const rootHash: `0x${string}` = `0x${rootHashBuf.toString("hex")}`;

    const blockNumber = view.getBigUint64(offset, true);
    offset += 8;

    const treeHeight = view.getUint32(offset, true);
    offset += 4;

    const numLeaves = view.getBigUint64(offset, true);
    offset += 8;

    const leafHashes: `0x${string}`[] = [];
    for (let i = 0n; i < numLeaves; i++) {
      const leafBuffer = new ArrayBuffer(numLeafBytes);
      const leafView = new DataView(leafBuffer);
      for (let j = 0; j < numLeafBytes; j++) {
        leafView.setUint8(j, view.getUint8(offset));
        offset += 1;
      }
      leafHashes.push(`0x${Buffer.from(leafBuffer).toString("hex")}`);
    }

    return new DepositTreeEncoder(rootHash, blockNumber, treeHeight, leafHashes);
  }

  equals(other: DepositTreeEncoder): boolean {
    if (this.rootHash !== other.rootHash) {
      return false;
    }
    if (this.blockNumber !== other.blockNumber) {
      return false;
    }
    if (this.treeHeight !== other.treeHeight) {
      return false;
    }
    if (this.leafHashes.length !== other.leafHashes.length) {
      return false;
    }
    for (let i = 0; i < this.leafHashes.length; i++) {
      if (this.leafHashes[i] !== other.leafHashes[i]) {
        return false;
      }
    }

    return true;
  }
}
