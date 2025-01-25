import { IHashOut, hashNoPad } from "poseidon-goldilocks";
import { splitUint256To32BitChunks } from "./poseidon";

export class EligibleLeaf {
  // 4 bytes, integer
  readonly depositIndex: number;
  // 32 bytes, integer
  readonly amount: bigint;

  constructor(depositIndex: number, amount: bigint) {
    this.depositIndex = depositIndex;
    this.amount = amount;
  }

  encode(): ArrayBuffer {
    const view = new DataView(new ArrayBuffer(36));
    let offset = 0;
    view.setUint32(offset, this.depositIndex, true);
    offset += 4;
    let amount = this.amount;
    const mask = (1n << 64n) - 1n;
    for (let i = 0; i < 32; i += 8) {
      const byte = amount & mask;
      view.setBigUint64(offset, byte, true);
      offset += 8;
      amount >>= 64n;
    }
    return view.buffer;
  }

  static decode(buffer: ArrayBuffer): EligibleLeaf {
    const view = new DataView(buffer);
    let offset = 0;
    const depositIndex = view.getUint32(offset, true);
    offset += 4;
    let amount = 0n;
    for (let i = 0; i < 32; i += 8) {
      const base = BigInt(i) * 8n;
      amount += view.getBigUint64(offset, true) << base;
      offset += 8;
    }
    return new EligibleLeaf(depositIndex, amount);
  }

  equals(other: EligibleLeaf): boolean {
    return this.depositIndex === other.depositIndex && this.amount === other.amount;
  }

  hash(): IHashOut {
    const input = [BigInt(this.depositIndex)];
    const amount = splitUint256To32BitChunks(this.amount);
    input.push(...amount);

    return hashNoPad(input);
  }
}
