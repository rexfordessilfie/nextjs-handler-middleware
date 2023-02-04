import { NextApiRequest, NextApiResponse } from "next";
import { Callback, Handler, inferCallbackReq, MergeLeft } from "./types";

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
  WReqDeps = unknown,
  T = MergeLeft<NextApiRequest, WReqParams & Partial<WReqDeps>>
>(
  callback: Callback<
    T extends NextApiRequest ? T : NextApiRequest,
    NextApiResponse<WResBody>
  >
) {
  return function middleware(
    handler: Handler<inferCallbackReq<typeof callback>>
  ): typeof handler {
    // Return a new handler function that executes the
    // provided callback
    return async function newHandler(req, res) {
      // Define the next() function
      function next() {
        return handler(req, res);
      }

      // Execute the provided callback
      return await callback(req, res, next);
    };
  };
}
