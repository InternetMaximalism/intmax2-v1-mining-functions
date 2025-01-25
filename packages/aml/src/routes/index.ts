import { BASE_PATH, healthRoute } from "@intmax2-function/shared";
import { route as amlRoute } from "./aml.route";

export const routes = [
  {
    path: `/${BASE_PATH}/health`,
    route: healthRoute,
  },
  {
    path: `/${BASE_PATH}/aml`,
    route: amlRoute,
  },
];
