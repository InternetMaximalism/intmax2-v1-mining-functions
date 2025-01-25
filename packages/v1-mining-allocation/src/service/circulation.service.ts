import {
  Circulation,
  FIRESTORE_DOCUMENTS,
  Mining,
  type MiningData,
  type MiningEntries,
  config,
  eligibleMiningProcessor,
  logger,
} from "@intmax2-function/shared";

export const processCirculation = async (miningService: Mining, minings: MiningData[]) => {
  const miningEntries = await eligibleMiningProcessor(minings, {
    tracerDepth: config.TRACER_MINING_DEPTH,
  });

  await saveMiningEntries(miningService, miningEntries);
  await updateCirculationAddresses(miningEntries.newCirculationAddresses);

  return miningEntries;
};

const saveMiningEntries = async (miningService: Mining, miningEntries: MiningEntries) => {
  const { nonCirculationMiningEntries, circulationMiningEntries } = miningEntries;

  logger.info(
    `
      Added mining entries - Non-circulation minings: ${nonCirculationMiningEntries.length},
      Circulation minings: ${circulationMiningEntries.length},
    `,
  );

  await miningService.addMiningsBatch([...circulationMiningEntries]);
};

const updateCirculationAddresses = async (newAddresses: string[]): Promise<void> => {
  if (newAddresses.length === 0) {
    logger.info("Circulation update: No new addresses confirmed as circulating in this batch");
    return;
  }

  logger.info(
    `Circulation update: ${newAddresses.length} new address(es) confirmed as circulating`,
  );

  const circulation = new Circulation(FIRESTORE_DOCUMENTS.CIRCULATION_ADDRESSES);
  await circulation.upsertCirculationsBatch(
    newAddresses.map((address) => ({
      address,
      circulationConfirmed: true,
    })),
  );
};
