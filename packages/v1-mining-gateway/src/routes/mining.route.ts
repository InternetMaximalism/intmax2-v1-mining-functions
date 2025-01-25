import { Hono } from "hono";
import { CACHE_TIMEOUTS } from "../constants";
import * as miningController from "../controllers/mining.controller";
import { cacheMiddleware } from "../middlewares/cache.middleware";

export const route = new Hono();

route.use("/addresses/*", (c, next) => cacheMiddleware(c, next, CACHE_TIMEOUTS.DETAIL));

route.get("/addresses/:address/exclusion", miningController.checkAddressExclusion);
route.get("/gas-fee/estimate", miningController.getGasFees);
