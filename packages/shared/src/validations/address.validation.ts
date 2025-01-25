import { z } from "zod";
import type { Address } from "../types";

const ETHEREUM_ADDRESS_REGREX = /^0x[a-fA-F0-9]{40}$/;

const isValidEthereumAddress = (address: string): boolean => {
  return ETHEREUM_ADDRESS_REGREX.test(address);
};

export const addressSchema = z.custom<Address>(
  (val) => {
    return isValidEthereumAddress(val as string);
  },
  {
    message: "Invalid Ethereum address format",
  },
);

export const addressValidation = z.strictObject({
  address: addressSchema,
});

export const addressesValidation = z.strictObject({
  addresses: z
    .array(addressSchema)
    .min(1)
    .max(30)
    .transform((addresses) => [...new Set(addresses)]),
});
