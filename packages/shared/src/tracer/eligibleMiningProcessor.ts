import { config } from "../config";
import { DEPTH_LIMIT, TRACE_MAX_CONCURRENCY } from "../constants";
import type { CategorizedMiningEntries, EligibleMiningEntry, RejectReason } from "../types";
import { AddressTracer } from "./addressTracer";
import { Queue } from "./queue";

export const eligibleMiningProcessor = async (
  eligibleMiningEntries: EligibleMiningEntry[],
  options: { tracerDepth: number },
) => {
  if (eligibleMiningEntries.length === 0) {
    return {
      nonCirculationMiningEntries: [],
      circulationMiningEntries: [],
      newCirculationAddresses: [],
    };
  }

  const { tracer } = await initializeProcessing(eligibleMiningEntries, options.tracerDepth);

  const { nonCirculationAddresses, newCirculationAddresses, rejectReasons } =
    await tracer.processTraceQueuedAddresses();

  const categorizedEntries = categorizeEntries(
    eligibleMiningEntries,
    nonCirculationAddresses,
    rejectReasons,
  );

  return {
    ...categorizedEntries,
    newCirculationAddresses: Array.from(newCirculationAddresses),
  };
};

const initializeProcessing = async (
  entries: readonly EligibleMiningEntry[],
  tracerDepth: number,
) => {
  const uniqueAddresses = new Set(entries.map((entry) => entry.address.toLowerCase()));
  const queue = new Queue<string>();
  queue.enqueueMany(Array.from(uniqueAddresses));

  const contractAddress = config.V1_INT1_CONTRACT_ADDRESS.toLowerCase() as `0x${string}`;

  const tracer = new AddressTracer(
    tracerDepth,
    queue,
    DEPTH_LIMIT,
    TRACE_MAX_CONCURRENCY,
    contractAddress,
  );

  await tracer.initialize();

  return { tracer };
};

const categorizeEntries = (
  entries: EligibleMiningEntry[],
  nonCirculationAddresses: Set<string>,
  rejectedReasons: Map<string, string>,
) => {
  return entries.reduce(
    (acc, entry) => {
      if (nonCirculationAddresses.has(entry.address)) {
        acc.nonCirculationMiningEntries.push({ ...entry, isEligible: true });
      } else {
        const rejectReason = rejectedReasons.get(entry.address) as RejectReason | undefined;
        acc.circulationMiningEntries.push({ ...entry, isEligible: false, rejectReason });
      }
      return acc;
    },
    { nonCirculationMiningEntries: [], circulationMiningEntries: [] } as CategorizedMiningEntries,
  );
};
