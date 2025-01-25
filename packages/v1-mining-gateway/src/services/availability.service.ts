import { config } from "@intmax2-function/shared";
import semver from "semver";
import { AVAILABILITY_MESSAGE, DEFAULT_V1_EXPIRATION_TIME } from "../constants";

const expirationTime = new Date(process.env.V1_EXPIRATION_TIME || DEFAULT_V1_EXPIRATION_TIME);

export const getAvailability = (version?: string) => {
  const currentTime = new Date();
  const isAvailable = currentTime < expirationTime;

  if (version !== undefined && !semver.gte(version, config.V1_MINING_CLI_MINIMUM_VERSION)) {
    return {
      isAvailable: false,
      message: AVAILABILITY_MESSAGE.update,
    };
  }

  return {
    isAvailable,
    message: isAvailable ? AVAILABILITY_MESSAGE.available : AVAILABILITY_MESSAGE.migration,
  };
};
