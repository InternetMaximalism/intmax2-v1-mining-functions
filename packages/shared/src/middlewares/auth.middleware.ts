import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { CLIENT_SERVICE } from "../constants";
import { UnAuthorizedError } from "../lib";
import type { JWTPayload } from "../types";

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnAuthorizedError("No token provided");
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.AUTH_JWT_SECRET) as JWTPayload;

    c.set(CLIENT_SERVICE, decoded.clientServiceName);

    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      throw new UnAuthorizedError("Token has expired");
    }

    await next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnAuthorizedError("Invalid token");
    }
    throw error;
  }
};
