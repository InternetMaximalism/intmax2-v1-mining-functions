import { hashNoPad } from "poseidon-goldilocks";

export function getPubkeySaltHash(intMaxAddress: bigint, salt: string): string {
  const pubkeyChunks = splitUint256To32BitChunks(intMaxAddress);
  const saltChunks = splitSaltTo64BitChunks(salt);
  const inputs = [...pubkeyChunks, ...saltChunks];
  const hashChunks = hashNoPad(inputs);
  const hash = combine64BitChunksToBytes(hashChunks);
  return "0x" + Buffer.from(hash).toString("hex").padStart(64, "0");
}

const splitUint256ToChunks = (chunkBits: number, value: bigint): bigint[] => {
  if (256 % chunkBits !== 0) {
    throw new Error("Invalid chunkBits");
  }

  const limbSize = 256 / chunkBits;
  const mask = (1n << BigInt(chunkBits)) - 1n;
  const chunks: bigint[] = [];
  for (let i = 0; i < limbSize; i++) {
    const chunk = value & mask;
    chunks.unshift(chunk);
    value >>= BigInt(chunkBits);
  }

  return chunks;
};

export function splitUint256To64BitChunks(value: bigint): bigint[] {
  return splitUint256ToChunks(64, value);
}

export function splitUint256To32BitChunks(value: bigint): bigint[] {
  return splitUint256ToChunks(32, value);
}

export function combine64BitChunksToBytes(chunks: bigint[]): Uint8Array {
  const result = new Uint8Array(8 * chunks.length);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    for (let j = 0; j < 8; j++) {
      const byte = (chunk >> (BigInt(j) * 8n)) & 0xffn;
      result[i * 8 + (7 - j)] = Number(byte);
    }
  }

  return result;
}

export function splitSaltTo64BitChunks(salt: string): bigint[] {
  return splitUint256To64BitChunks(BigInt(addHexPrefix(salt)));
}

export function uint8ArrayToHexString(uint8Array: Uint8Array): string {
  return [...uint8Array].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function removeHexPrefix(hexString: string): string {
  if (hexString.startsWith("0x")) {
    return hexString.slice(2);
  }
  return hexString;
}

export function addHexPrefix(hexString: string): string {
  if (!hexString.startsWith("0x")) {
    return "0x" + hexString;
  }
  return hexString;
}
