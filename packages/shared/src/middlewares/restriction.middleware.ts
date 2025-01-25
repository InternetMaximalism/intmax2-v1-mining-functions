import { getConnInfo } from "@hono/node-server/conninfo";
import { ipRestriction } from "hono/ip-restriction";
import httpStatus from "http-status";
import { config } from "../config";

export const restriction = ipRestriction(
  getConnInfo,
  {
    allowList: config.AUTH_IP_ALLOW_LIST.split(",") || [],
  },
  async (remote, c) => {
    return c.json(
      {
        code: "IP_NOT_ALLOWED",
        message: `Your IP address (${remote.addr}) is not allowed to access this resource.`,
      },
      httpStatus.FORBIDDEN,
    );
  },
);
