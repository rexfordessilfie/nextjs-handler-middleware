import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";
import { Callback, Handler, inferCallbackReq } from "./types";

/**
 * Creates a middleware-like wrapper for wrapping Next.js API handlers.
 *
 * @param callback - A callback that exposes the API handler's request and response args,
 * as well as a next() function for executing the wrapped handler.
 *
 * @returns A wrapper function that takes a Next.js API handler as argument,
 *  and returns the newly wrapped handler
 */
export function createWrapper<
  WReqParams = unknown,
  WResBody = unknown,
  WReqDeps = unknown
>(
  callback: Callback<
    NextApiRequest & WReqParams & Partial<WReqDeps>,
    NextApiResponse<WResBody>
  >
) {
  return function wrapper(
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
