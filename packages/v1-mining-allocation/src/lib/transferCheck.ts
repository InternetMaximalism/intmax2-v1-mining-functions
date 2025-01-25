import {
  AddressTracer,
  Alchemy,
  DEPTH_LIMIT,
  Queue,
  type Token,
  config,
} from "@intmax2-function/shared";
import { zeroAddress } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

export class TransferCheck {
  private static instance: TransferCheck | undefined;
  private readonly alchemy: Alchemy;
  readonly addressTracer: AddressTracer;
  tokenPriceList: Token[] = [];

  public static getInstance() {
    if (!this.instance) {
      this.instance = new TransferCheck();
    }
    return this.instance;
  }

  constructor() {
    this.alchemy = new Alchemy();
    this.addressTracer = this.initializeAddressTracer();
  }

  async initialize(): Promise<void> {
    await this.addressTracer.initialize();
  }

  async getSortedTransfersByMarketValue(address: string, blockNumber: number) {
    const filteredTransfers = await this.getTransferData(address, blockNumber);
    const sortedTransfers = this.addressTracer.sortTransfersByMarketValue(filteredTransfers);
    return sortedTransfers;
  }

  private initializeAddressTracer() {
    const queue = new Queue<string>();
    const randomWallet = privateKeyToAccount(generatePrivateKey()).address;
    return new AddressTracer(0, queue, DEPTH_LIMIT, 2, randomWallet);
  }

  private async getTransferData(address: string, fromBlockNumber?: number) {
    const transferOptions = {
      fromBlock: fromBlockNumber ?? config.V1_INT1_CONTRACT_DEPLOYED_BLOCK,
      toAddress: address,
    };
    const { transfers } = await this.alchemy.getAssetTransfers(transferOptions);
    const filteredTransfers = transfers
      .filter((transfer) => transfer.from !== zeroAddress)
      .map((transfer) => ({ ...transfer, from: transfer.from.toLowerCase() }));

    return filteredTransfers;
  }
}
