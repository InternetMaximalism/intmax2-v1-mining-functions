import semver from "semver";
import { z } from "zod";
import { addressSchema } from "./address.validation";

export const v1MiningWithdrawValidation = z.object({
  publicInputs: z.object({
    depositRoot: z.string(),
    nullifier: z.string(),
    recipient: z.string(),
    tokenIndex: z.number(),
    amount: z.string(),
  }),
  proof: z.string(),
});

export type V1MiningWithdrawValidationType = z.infer<typeof v1MiningWithdrawValidation>;

export const v1CreateProofValidation = z.strictObject({
  address: addressSchema,
  proof: z.any(),
  public_inputs: z.any(),
});

export type V1CreateProofValidationType = z.infer<typeof v1CreateProofValidation>;

export const v1GetProofValidation = z.strictObject({
  jobId: z.string().min(1, "JobId must not be empty"),
});

export const v1GetAvailabilityValidation = z.strictObject({
  version: z
    .string()
    .refine(
      (version) => {
        if (version === undefined) return true;
        return semver.valid(version) !== null;
      },
      {
        message: `Invalid version`,
      },
    )
    .optional(),
});

export const v1GetSubmitProofValidation = z.strictObject({
  withdrawalId: z.string().min(1, "WithdrawalId must not be empty"),
});
