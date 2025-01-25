import { serve } from "@hono/node-server";
import {
  APP_TIMEOUT,
  NotFoundError,
  config,
  configureLogging,
  handleError,
  limiter,
  logger,
  requestMiddleware,
  shutdown,
} from "@intmax2-function/shared";
import { Hono } from "hono";
import { prettyJSON } from "hono/pretty-json";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { appendTrailingSlash } from "hono/trailing-slash";
import { name } from "../package.json";
import { bootstrap } from "./lib/bootstrap";
import { WithdrawalQueue } from "./lib/withdrawalQueue";
import { geoIPRestriction } from "./middlewares/geoip.middleware";
import { versionMiddleware } from "./middlewares/version.middleware";
import { routes } from "./routes";

const { PORT: port } = config;

const app = new Hono({ strict: true });

bootstrap();

app.use(secureHeaders());
app.use(limiter);
app.use(geoIPRestriction);
app.use(versionMiddleware);

app.use(timeout(APP_TIMEOUT));
app.use(requestMiddleware);

app.use(appendTrailingSlash());
app.use(prettyJSON());

configureLogging(app);

app.notFound(() => {
  throw new NotFoundError();
});

app.onError(handleError);

routes.forEach(({ path, route }) => {
  app.route(path, route);
});

logger.info("%s server is running on port %d", name.toLocaleUpperCase(), port);

const server = serve({
  fetch: app.fetch,
  port,
});

process.on("SIGTERM", () => shutdown(server, () => WithdrawalQueue.getInstance().dispose()));
process.on("SIGINT", () => shutdown(server, () => WithdrawalQueue.getInstance().dispose()));
