import { NextApiResponse } from "next";
import {
  CreateMiddlewareCb,
  Handler,
  InferCreateMiddlewareCbReq,
  ExtendedNextApiRequest
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
  MReqParams extends Record<string, any> = {},
  MResBody = unknown,
  MReqDeps extends Record<string, any> = {},
  MReq extends ExtendedNextApiRequest<
    Partial<MReqParams> | MReqParams
  > = ExtendedNextApiRequest<Partial<MReqParams>>,
  MRes extends NextApiResponse<MResBody> = NextApiResponse<MResBody>
>(callback: CreateMiddlewareCb<MReq & Partial<MReqDeps>, MRes>) {
  return function middleware(handler: Handler<MReq>): typeof handler {
    return async function middlewareHandler(req, res) {
      const next = () => handler(req, res);

      // Run the callback. Cast req to the type of callback's req
      // since we assume deps are already attached to the request
      return await callback(
        req as InferCreateMiddlewareCbReq<typeof callback>,
        res as MRes,
        next
      );
    };
  };
}
