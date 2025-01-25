import { config, logger } from "@intmax2-function/shared";
import type { ExtendedContext } from "../types";

interface RequestInitWithDuplex extends RequestInit {
  duplex?: "half";
}

export const streamToJSON = async (stream: ReadableStream) => {
  const reader = stream.getReader();
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += new TextDecoder().decode(value);
  }
  return JSON.parse(result);
};

export const handleProxyRequest = async (c: ExtendedContext) => {
  const url = new URL(c.req.url);
  const targetUrl = new URL(config.ZKP_PROVER_HTTP_ENDPOINT);
  url.host = targetUrl.host;
  url.protocol = targetUrl.protocol;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${config.ZKP_PROVER_JWT}`);

  const IS_GET_OR_HEAD = ["GET", "HEAD"].includes(c.req.method);

  const method = c.req.method;

  let options: RequestInitWithDuplex;

  if (IS_GET_OR_HEAD) {
    options = {
      method,
      headers,
    };
  } else {
    options = {
      method,
      headers,
      body: c.proxyStream || (await c.req.arrayBuffer()),
      duplex: "half",
    };
  }

  const response = await fetch(url.toString(), options);
  if (!response.ok) {
    logger.warn(`Proxy request failed with status ${response.status}: ${response.statusText}`);
  }

  const newResponse = new Response(response.body, response);

  return newResponse;
};
