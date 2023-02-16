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
  WReqParams extends Record<string, any> = {},
  WResBody = unknown,
  WReqDeps extends Record<string, any> = {},
  WReq extends ExtendedNextApiRequest<
    Partial<WReqParams> | WReqParams
  > = ExtendedNextApiRequest<Partial<WReqParams>>,
  WRes extends NextApiResponse<WResBody> = NextApiResponse<WResBody>
>(callback: Callback<WReq & Partial<WReqDeps>, WRes>) {
  return function middleware(handler: Handler<WReq>): typeof handler {
    return async function middlewareHandler(req, res) {
      function next() {
        return handler(req, res);
      }

      // Run the callback. Cast req to the type of callback's req
      // since we assume deps are already attached to the request
      return await callback(
        req as inferCallbackReq<typeof callback>,
        res as WRes,
        next
      );
    };
  };
}
