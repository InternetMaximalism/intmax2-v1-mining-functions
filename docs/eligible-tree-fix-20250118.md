# Eligible Tree Fix

## Eligible Tree Issue - FIX Details

Date: 18/01/2025

The error occurred due to an issue introduced on November 16, 2024, when a sudden traffic surge on the Base network caused the ReplaceTransaction function to return a processed depositId. This mismatch between the depositId and the associated amount made it impossible to construct an accurate Eligible Tree.

We have now fixed the issue to ensure the accurate construction of the Eligible Tree.

### API Changes

Instead of assigning depositIndex to depositHash based on the order of depositId, we now derive it from depositLeafInsertedEvent. Additionally, since there can be multiple occurrences of the same depositHash, the smallest depositIndex among the corresponding events is selected to ensure consistency.

#### The previous implementation

```ts
const fetchDepositData = async (depositIds: bigint[]) => {
  const batches: bigint[][] = [];
  for (let i = 0; i < depositIds.length; i += BATCH_SIZE) {
    batches.push(depositIds.slice(i, i + BATCH_SIZE));
  }
  const ethereumClient = createNetworkClient(config.NETWORK_TYPE);
  const depositHashes: DepositHash[] = [];

  for (const batch of batches) {
    const results = (await ethereumClient.readContract({
      address: V1_INT1_CONTRACT_ADDRESS,
      abi: v1Int1Abi as Abi,
      functionName: "getDepositDataBatch",
      args: [batch],
    })) as GetDepositData[];
    const batchDepositHashes = results.reduce<DepositHash[]>((acc, depositData, index) => {
      const { depositHash, sender, isRejected } = depositData;
      if (sender !== zeroAddress && !isRejected) {
        acc.push({ depositId: batch[index], depositHash });
      }
      return acc;
    }, []);
    depositHashes.push(...batchDepositHashes);
  }

  const depositSorted = depositHashes.sort((a, b) => {
    if (a.depositId < b.depositId) return -1;
    if (a.depositId > b.depositId) return 1;
    return 0;
  });

  return depositSorted.map((data, depositIndex) => ({
    ...data,
    depositIndex,
  }));
};
```

#### Updated Implementation

[Code](https://github.com/InternetMaximalism/intmax2-v1-mining-functions/blob/main/packages/v1-mining-merkle-commitment/src/service/tree.service.ts#L108-L130)

```ts
const createIndexedAllocations = (
  allocations: MiningData[],
  depositLeafInsertedEvents: DepositLeafInsertedEvent[],
) => {
  const eventArgs = depositLeafInsertedEvents.map((event) => event.args);

  const indexedAllocations = allocations.map((allocation) => {
    const { depositId, depositHash } = allocation;
    const matchingEvents = eventArgs.filter((event) => event.depositHash === depositHash);

    if (matchingEvents.length === 0) {
      throw new Error(`Missing leaf insertion event for deposit: ${depositId}`);
    }
    const depositIndex = Math.min(...matchingEvents.map((event) => event.depositIndex));

    return {
      ...allocation,
      depositIndex,
    };
  });

  return indexedAllocations;
};
```

### Contract Updates

In the analyzeAndProcessDeposits function, it was possible to specify an upToDepositId that was smaller than an already existing ID. This issue has been fixed.

Updates to the contract are documented in the following commit: [commit](https://github.com/InternetMaximalism/intmax2-mining/commit/0b5e5d05aef14e9af684b15845a263db0ca3aa1c)

### Mining CLI Updates

Since there are multiple occurrences of the same depositHash, the smallest depositIndex corresponding to those occurrences is selected.

Updates to the command-line tool are documented in the following commit: [commit](https://github.com/InternetMaximalism/intmax2-mining-cli/commit/f546030137dc0d6d18001f16076b56aabde0cb5f)
