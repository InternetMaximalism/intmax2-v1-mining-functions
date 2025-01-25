import { encodePacked, keccak256 } from "viem";

export class DepositLeaf {
  // 32 bytes
  readonly recipientSaltHash: `0x${string}`;
  // 4 bytes, integer
  readonly tokenIndex: number;
  // 32 bytes, integer
  readonly amount: bigint;

  constructor(recipientSaltHash: `0x${string}`, tokenIndex: number, amount: bigint) {
    this.recipientSaltHash = recipientSaltHash;
    this.tokenIndex = tokenIndex;
    this.amount = amount;
  }

  encode(): ArrayBuffer {
    const view = new DataView(new ArrayBuffer(68));
    let offset = 0;
    const recipientSaltHash = Buffer.from(this.recipientSaltHash.slice(2), "hex");
    if (recipientSaltHash.length !== 32) {
      throw new Error("Invalid length of recipientSaltHash");
    }

    for (let i = 0; i < 32; i++) {
      view.setUint8(offset, recipientSaltHash[i]);
      offset += 1;
    }

    view.setUint32(offset, this.tokenIndex, true);
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

  static decode(buffer: ArrayBuffer): DepositLeaf {
    const view = new DataView(buffer);
    let offset = 0;
    const recipientSaltHashBuf = Buffer.alloc(32);
    for (let i = 0; i < 32; i++) {
      recipientSaltHashBuf[i] = view.getUint8(offset);
      offset += 1;
    }
    const recipientSaltHash: `0x${string}` = `0x${recipientSaltHashBuf.toString("hex")}`;

    const tokenIndex = view.getUint32(offset, true);
    offset += 4;
    let amount = 0n;
    for (let i = 0; i < 32; i += 8) {
      const base = BigInt(i) * 8n;
      amount += view.getBigUint64(offset, true) << base;
      offset += 8;
    }
    return new DepositLeaf(recipientSaltHash, tokenIndex, amount);
  }

  equals(other: DepositLeaf): boolean {
    return (
      this.recipientSaltHash === other.recipientSaltHash &&
      this.tokenIndex === other.tokenIndex &&
      this.amount === other.amount
    );
  }

  hash(): `0x${string}` {
    const hash = keccak256(
      encodePacked(
        ["bytes32", "uint32", "uint256"],
        [this.recipientSaltHash, this.tokenIndex, this.amount],
      ),
    );

    return hash;
  }
}
