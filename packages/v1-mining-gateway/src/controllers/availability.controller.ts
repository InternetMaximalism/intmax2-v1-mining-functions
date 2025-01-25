import { v1GetAvailabilityValidation } from "@intmax2-function/shared";
import type { Context } from "hono";
import * as availabilityService from "../services/availability.service";

export const getAvailability = async (c: Context) => {
  const paramsQuery = c.req.query();
  const { version } = await v1GetAvailabilityValidation.parseAsync(paramsQuery);
  const result = availabilityService.getAvailability(version);
  return c.json(result);
};
