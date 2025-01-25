import { Hono } from "hono";
import * as withdrawalController from "../controllers/withdrawal.controller";

export const route = new Hono();

route.post("/submit-proof", withdrawalController.submitProof);
route.get("/:withdrawalId/proof-status", withdrawalController.getWithdrawalProofStatus);
