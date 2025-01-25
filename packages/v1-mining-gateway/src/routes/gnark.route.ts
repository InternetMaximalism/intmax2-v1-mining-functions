import { Hono } from "hono";
import { compress } from "hono/compress";
import * as gnarkController from "../controllers/gnark.controller";

export const route = new Hono();

route.use("/get-proof", compress());

route.get("/health", gnarkController.getHealth);
route.post("/start-proof", gnarkController.startProof);
route.get("/get-proof", gnarkController.getProof);
