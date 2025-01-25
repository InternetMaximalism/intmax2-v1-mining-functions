import { Hono } from "hono";
import * as availabilityController from "../controllers/availability.controller";

export const route = new Hono();

route.get("/", availabilityController.getAvailability);
