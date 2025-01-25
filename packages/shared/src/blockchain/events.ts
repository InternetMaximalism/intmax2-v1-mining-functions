import { AbiEvent, parseAbiItem } from "abitype";
import type { PublicClient } from "viem";

export const v1DepositedEvent = parseAbiItem(
  "event Deposited(uint256 indexed depositId, address indexed sender, bytes32 indexed recipientSaltHash, uint32 tokenIndex, uint256 amount, uint256 depositedAt)",
);

export const v1DepositsAnalyzedAndProcessedEvent = parseAbiItem(
  "event DepositsAnalyzedAndProcessed(uint256 indexed upToDepositId, uint256[] rejectedIndices, bytes32[] depositHashes)",
);

export const v1WithdrawnEvent = parseAbiItem(
  "event Withdrawn(address indexed recipient, bytes32 indexed nullifier, uint32 tokenIndex, uint256 amount)",
);

export const v1DepositLeafInsertedEvent = parseAbiItem(
  "event DepositLeafInserted(uint32 indexed depositIndex, bytes32 indexed depositHash)",
);

export const erc20BridgeFinalizedEvent = parseAbiItem(
  "event ERC20BridgeFinalized(address indexed localToken, address indexed remoteToken, address indexed from, address to, uint256 amount, bytes extraData)",
);

export const ethBridgeFinalizedEvent = parseAbiItem(
  "event ETHBridgeFinalized(address indexed from, address indexed to, uint256 amount, bytes extraData)",
);

export const getEventLogs = async (
  client: PublicClient,
  address: `0x${string}`,
  event: AbiEvent,
  fromBlock: bigint,
  toBlock: bigint,
  args?: Record<string, unknown>,
) => {
  const logs = await client.getLogs({
    address,
    event,
    args,
    fromBlock,
    toBlock,
  });
  return logs;
};
