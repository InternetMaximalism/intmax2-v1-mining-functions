import { IHashOut, hashNoPad } from "poseidon-goldilocks";
import { EligibleLeaf } from "./eligibleLeaf";
import { combine64BitChunksToBytes } from "./poseidon";

export class EligibleTree {
  // 4 bytes, integer
  readonly treeHeight: number;

  readonly leaves: EligibleLeaf[];

  readonly layers: IHashOut[][];

  constructor(treeHeight: number, leaves: EligibleLeaf[]) {
    this.leaves = leaves;
    this.treeHeight = treeHeight;

    let layer = leaves.map((leaf) => leaf.hash());
    let zeroHash = new EligibleLeaf(0, 0n).hash();
    if (layer.length === 0) {
      layer.push(zeroHash);
    }
    this.layers = [layer];

    for (let i = 0; i < treeHeight; i++) {
      const newLayer = [];
      for (let j = 0; j < layer.length; j += 2) {
        const left = layer[j];
        const right = layer[j + 1] ?? zeroHash;
        newLayer.push(EligibleTree.hashPair(left, right));
      }
      zeroHash = EligibleTree.hashPair(zeroHash, zeroHash);
      layer = newLayer;
      this.layers.unshift(layer);
    }
  }

  // Default root hash when tree height is 32
  static defaultRoot(): `0x${string}` {
    return "0x7be55beb71aef2afea70062228cb45e8e95996769c3f17eb19259c28bc17ce98";
  }

  getMerkleRoot(): `0x${string}` {
    const root = Buffer.from(combine64BitChunksToBytes(this.layers[0][0])).toString("hex");
    return `0x${root}`;
  }

  getMerkleProof(index: number): string[] {
    const siblings = [];
    let zeroHash = new EligibleLeaf(0, 0n).hash();
    for (let i = 0; i < this.treeHeight; i++) {
      const siblingIndex = index ^ 1;
      const sibling = this.layers[this.treeHeight - i][siblingIndex] ?? zeroHash;
      siblings.push(`0x${Buffer.from(combine64BitChunksToBytes(sibling)).toString("hex")}`);
      index >>= 1;
      zeroHash = EligibleTree.hashPair(zeroHash, zeroHash);
    }

    return siblings;
  }

  static hashPair(left: IHashOut, right: IHashOut): IHashOut {
    const input = [...left, ...right];
    return hashNoPad(input);
  }
}
