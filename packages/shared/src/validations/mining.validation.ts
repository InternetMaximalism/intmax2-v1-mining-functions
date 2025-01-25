import { z } from "zod";
import { addressSchema } from "./address.validation";

export const createProofValidation = z.strictObject({
  address: addressSchema,
  proof: z.any(),
  public_inputs: z.any(),
});

export const getProofValidation = z.strictObject({
  jobId: z.string().min(1, "JobId must not be empty"),
});

export type CreateProofValidationType = z.infer<typeof createProofValidation>;
