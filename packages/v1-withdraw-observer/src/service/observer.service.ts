import {
  BLOCK_RANGE_MINIMUM,
  Circulation,
  type EventData,
  type WithdrawnEvent,
  fetchEvents,
  getStartBlockNumber,
  logger,
  v1WithdrawnEvent,
  validateBlockRange,
} from "@intmax2-function/shared";
import type { PublicClient } from "viem";
import { V1_INT1_CONTRACT_ADDRESS, V1_INT1_CONTRACT_DEPLOYED_BLOCK } from "../constants";
import type { WithdrawalAddress } from "../types";

export const getWithdrawalUniqueAddresses = async (
  ethereumClient: PublicClient,
  currentBlockNumber: bigint,
  lastProcessedEvent: EventData | null,
) => {
  const startBlockNumber = getStartBlockNumber(lastProcessedEvent, V1_INT1_CONTRACT_DEPLOYED_BLOCK);
  validateBlockRange("v1INT1 v1WithdrawnEvent events", startBlockNumber, currentBlockNumber);

  const withdrawnEvents = await fetchEvents<WithdrawnEvent>(ethereumClient, {
    startBlockNumber,
    endBlockNumber: currentBlockNumber,
    blockRange: BLOCK_RANGE_MINIMUM,
    contractAddress: V1_INT1_CONTRACT_ADDRESS,
    eventInterface: v1WithdrawnEvent,
  });

  const addressBlockMap = new Map<string, number>();

  for (const event of withdrawnEvents) {
    const address = event.args.recipient.toLowerCase();
    const blockNumber = Number(event.blockNumber);

    const currentStoredBlock = addressBlockMap.get(address);
    if (!currentStoredBlock || blockNumber < currentStoredBlock) {
      addressBlockMap.set(address, blockNumber);
    }
  }

  return Array.from(addressBlockMap.entries()).map(([address, blockNumber]) => ({
    address,
    withdrawBlockNumber: blockNumber,
  }));
};

export const findUnregisteredWithdrawalAddresses = async (
  circulation: Circulation,
  withdrawalAddresses: WithdrawalAddress[],
) => {
  if (withdrawalAddresses.length === 0) {
    return [];
  }

  const targetAddresses = withdrawalAddresses.map((withdrawal) => withdrawal.address);

  const registeredAddresses = await circulation.fetchInCirculations(targetAddresses);
  const registeredAddressSet = new Set(registeredAddresses.map((record) => record.address));

  const unregisteredAddresses = withdrawalAddresses.filter(
    ({ address }) => !registeredAddressSet.has(address),
  );

  return unregisteredAddresses;
};

export const processWithdrawalAddresses = async ({
  unregisteredAddresses,
  circulation,
}: {
  unregisteredAddresses: WithdrawalAddress[];
  circulation: Circulation;
}) => {
  if (unregisteredAddresses.length > 0) {
    logger.info(`New unregistered withdrawal addresses: ${unregisteredAddresses.length}`);

    const addressesToRegister = unregisteredAddresses.map(({ address, withdrawBlockNumber }) => ({
      address,
      withdrawBlockNumber,
      withdrawConfirmed: true,
    }));

    await circulation.upsertCirculationsBatch(addressesToRegister);
    return;
  }

  logger.info("No new withdrawal addresses found.");
};
