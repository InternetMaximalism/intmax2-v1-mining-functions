import { authMiddleware, requestMiddleware, restriction } from "@intmax2-function/shared";
import { Hono } from "hono";
import * as amlController from "../controllers/aml.controller";

export const route = new Hono();

route.use(requestMiddleware);
route.use(restriction);
route.use(authMiddleware);

route.get("/crystal-health", amlController.crystalHealthCheck);
route.get("/score", amlController.fetchAMLScore);
route.get("/score/list", amlController.fetchAMLScoreList);
