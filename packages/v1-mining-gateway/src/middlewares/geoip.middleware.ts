import { getConnInfo } from "@hono/node-server/conninfo";
import { ForbiddenError } from "@intmax2-function/shared";
import geoip from "geoip-lite";
import { createMiddleware } from "hono/factory";
import { RESTRICTED_COUNTRY_CODES } from "../constants";
import type { RestrictedCountryCode } from "../types";

export const geoIPRestriction = createMiddleware(async (c, next) => {
  const xForwardedFor = c.req.header("X-Forwarded-For");
  const conn = getConnInfo(c);
  const ip = xForwardedFor ? xForwardedFor.split(",")[0].trim() : conn.remote.address;
  const geo = geoip.lookup(ip as string);

  if (geo && geo.country in RESTRICTED_COUNTRY_CODES) {
    throw new ForbiddenError(
      `Access denied from ${RESTRICTED_COUNTRY_CODES[geo.country as RestrictedCountryCode]} IP address`,
    );
  }

  await next();
});
