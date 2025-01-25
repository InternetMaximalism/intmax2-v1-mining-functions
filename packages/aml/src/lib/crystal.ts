import {
  type AddMonitoringTxParams,
  AppError,
  CRYSTAL_API_ENDPOINT,
  ErrorCode,
  type MonitoringTxRequest,
  type MonitoringTxResponse,
  config,
  debugLog,
  logger,
  sleep,
} from "@intmax2-function/shared";
import axios, { AxiosError, type AxiosInstance } from "axios";
import {
  CRYSTAL_API_TIMEOUT,
  CRYSTAL_MAX_RETRY,
  CRYSTAL_SLEEP_TIME,
  CRYSTAL_STATUS_READY,
} from "../constants";

export class Crystal {
  private static instance: Crystal | undefined;
  private readonly axiosInstance: AxiosInstance;
  private readonly HEALTH_CHECK_MESSAGE = "CB Global API works!";
  private readonly TARGET_NETWORK = "eth" as const;
  private readonly REQUEST_NAME = config.CRYSTAL_REQUEST_NAME;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: CRYSTAL_API_ENDPOINT,
      timeout: CRYSTAL_API_TIMEOUT,
      headers: {
        "X-Auth-Apikey": config.CRYSTAL_API_KEY,
      },
    });
  }

  public static getInstance() {
    if (!Crystal.instance) {
      Crystal.instance = new Crystal();
    }
    return Crystal.instance;
  }

  async checkHealth() {
    const response = await this.axiosInstance.get<string>("/");
    if (response.data !== this.HEALTH_CHECK_MESSAGE) {
      throw new AppError(500, ErrorCode.INTERNAL_SERVER_ERROR, "AML API is not healthy");
    }

    return response.data;
  }

  async addMonitoringTx({
    address,
    direction = "withdrawal",
    txHash,
    tokenId,
  }: AddMonitoringTxParams) {
    const requestData: MonitoringTxRequest = {
      token_id: tokenId,
      tx: txHash,
      direction,
      address,
      name: this.REQUEST_NAME,
      currency: this.TARGET_NETWORK,
    };

    try {
      let retries = 0;
      let lastResponse;

      while (retries < CRYSTAL_MAX_RETRY) {
        retries += 1;
        const response = await this.axiosInstance.post<MonitoringTxResponse>(
          "/monitor/tx/add",
          requestData,
        );
        debugLog(response.data, "addMonitoringTxResponse");

        lastResponse = response.data;

        if (response.data.data.status !== CRYSTAL_STATUS_READY) {
          logger.info(`Crystal status is not ready: ${response.data.data.status}`);
          logger.info(`Retry to add monitoring TX: ${address}`);
          await sleep(CRYSTAL_SLEEP_TIME);
          continue;
        }

        return lastResponse as MonitoringTxResponse;
      }

      return lastResponse as MonitoringTxResponse;
    } catch (error) {
      if (error instanceof AxiosError) {
        const details = `
        address: ${address}
        direction: ${direction}
        errorMessage: ${error.message}
        errorResponse: ${JSON.stringify(error.response?.data)}
        `;
        logger.error(`Failed to add monitoring TX ${details}`);
        throw new Error(`Failed to add monitoring TX: ${error.message}`);
      }
      throw error;
    }
  }
}
