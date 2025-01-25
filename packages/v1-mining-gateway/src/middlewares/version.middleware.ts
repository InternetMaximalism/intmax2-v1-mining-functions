import { BadRequestError, config } from "@intmax2-function/shared";
import type { Context, Next } from "hono";
import semver from "semver";
import { TOKEN_CLAIM_MINIMUM_VERSION } from "../constants";

const TOKEN_CLAIM_PATHS = [
  "/v1/gnark-claim-circuit/start-proof",
  "/v1/gnark-claim-circuit/get-proof",
];

export const versionMiddleware = async (c: Context, next: Next) => {
  const versionHeader = c.req.header("X-Version");

  if (!versionHeader) {
    throw new BadRequestError("X-Version header is required");
  }

  if (TOKEN_CLAIM_PATHS.includes(c.req.path)) {
    validateTokenClaimVersion(versionHeader);
  }

  validateGlobalVersion(versionHeader);

  await next();
};

const validateTokenClaimVersion = (versionHeader: string) => {
  validateVersion(
    versionHeader,
    TOKEN_CLAIM_MINIMUM_VERSION,
    `Claim X-Version must be greater than or equal to ${TOKEN_CLAIM_MINIMUM_VERSION}`,
  );
};

const validateGlobalVersion = (versionHeader: string): void => {
  validateVersion(
    versionHeader,
    config.V1_MINING_CLI_MINIMUM_VERSION,
    `X-Version must be greater than or equal to ${config.V1_MINING_CLI_MINIMUM_VERSION}`,
  );
};

const validateVersion = (version: string, minimumVersion: string, errorMessage: string): void => {
  if (!semver.valid(version)) {
    throw new BadRequestError("Invalid version format");
  }

  if (!semver.gte(version, minimumVersion)) {
    throw new BadRequestError(errorMessage);
  }
};
