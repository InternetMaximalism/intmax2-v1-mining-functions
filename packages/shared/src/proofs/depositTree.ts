import { encodePacked, keccak256, zeroHash } from "viem";
import { DepositLeaf } from "./depositLeaf";

export class DepositTree {
  // 4 bytes, integer
  readonly treeHeight: number;

  // readonly leafHashes: `0x${string}`[];

  readonly layers: `0x${string}`[][];

  constructor(treeHeight: number, leafHashes: `0x${string}`[]) {
    this.treeHeight = treeHeight;

    let layer = leafHashes;
    let zeroDepositHash = new DepositLeaf(zeroHash, 0, 0n).hash();
    if (layer.length === 0) {
      layer.push(zeroDepositHash);
    }
    this.layers = [layer];

    for (let i = 0; i < treeHeight; i++) {
      const newLayer: `0x${string}`[] = [];
      for (let j = 0; j < layer.length; j += 2) {
        const left = layer[j];
        const right = layer[j + 1] ?? zeroDepositHash;
        newLayer.push(DepositTree.hashPair(left, right));
      }
      zeroDepositHash = DepositTree.hashPair(zeroDepositHash, zeroDepositHash);
      layer = newLayer;
      this.layers.unshift(layer);
    }
  }

  // Default root hash when tree height is 32
  static defaultRoot(): `0x${string}` {
    return "0xb6155ab566bbd2e341525fd88c43b4d69572bf4afe7df45cd74d6901a172e41c";
  }

  static FromLeaves(treeHeight: number, leaves: DepositLeaf[]) {
    return new DepositTree(
      treeHeight,
      leaves.map((leaf) => leaf.hash()),
    );
  }

  getLeafHashes(): `0x${string}`[] {
    return this.layers[this.treeHeight];
  }

  getMerkleRoot(): `0x${string}` {
    return this.layers[0][0] as `0x${string}`;
  }

  getMerkleProof(index: number): string[] {
    const siblings = [];
    let zeroDepositHash = new DepositLeaf(zeroHash, 0, 0n).hash();
    for (let i = 0; i < this.treeHeight; i++) {
      const siblingIndex = index ^ 1;
      const sibling = this.layers[this.treeHeight - i][siblingIndex] ?? zeroDepositHash;
      siblings.push(sibling);
      index >>= 1;
      zeroDepositHash = DepositTree.hashPair(zeroDepositHash, zeroDepositHash);
    }

    return siblings;
  }

  static hashPair(left: `0x${string}`, right: `0x${string}`): `0x${string}` {
    const hash = keccak256(encodePacked(["bytes32", "bytes32"], [left, right]));

    return hash;
  }
}
