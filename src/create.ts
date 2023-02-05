import { NextApiResponse } from "next";
import {
  Callback,
  Handler,
  inferCallbackReq,
  ExtendedNextApiRequest,
} from "./types";

/**
 * Creates a middleware-like functionality for Next.js API handlers.
 *
 * @param callback - A callback that exposes the API handler's request and response args,
 * as well as a next() function for executing the wrapped handler.
 *
 * @returns A middleware function that takes a Next.js API handler as argument,
 *  and returns the newly wrapped handler
 */
export function createMiddleware<
  WReqParams = unknown,
  WResBody = unknown,
  WReqDeps = unknown
>(
  callback: Callback<
    ExtendedNextApiRequest<Partial<WReqParams> & Partial<WReqDeps>>,
    NextApiResponse<WResBody>
  >
) {
  return function middleware(
    handler: Handler<ExtendedNextApiRequest<Partial<WReqParams>>>
  ): typeof handler {
    return async function middlewareHandler(req, res) {
      function next() {
        return handler(req, res);
      }

      // Run the callback. Cast req to the type of callback's req
      // since we assume deps are already attached to the request
      return await callback(
        req as inferCallbackReq<typeof callback>,
        res,
        next
      );
    };
  };
}
