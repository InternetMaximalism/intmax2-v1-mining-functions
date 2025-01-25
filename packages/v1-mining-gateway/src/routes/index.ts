import { BASE_PATH, healthRoute } from "@intmax2-function/shared";
import { route as availabilityRoute } from "./availability.route";
import { route as gnarkRoute } from "./gnark.route";
import { route as miningRoute } from "./mining.route";
import { route as withdrawalRoute } from "./withdrawal.route";

export const routes = [
  {
    path: `${BASE_PATH}/health`,
    route: healthRoute,
  },
  {
    path: `${BASE_PATH}/gnark-withdraw-circuit`,
    route: gnarkRoute,
  },
  {
    path: `${BASE_PATH}/gnark-claim-circuit`,
    route: gnarkRoute,
  },
  {
    path: `${BASE_PATH}/availability`,
    route: availabilityRoute,
  },
  {
    path: `${BASE_PATH}/withdrawal`,
    route: withdrawalRoute,
  },
  {
    path: `${BASE_PATH}/mining`,
    route: miningRoute,
  },
];
