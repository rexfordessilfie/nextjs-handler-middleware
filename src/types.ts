import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";

export type Middleware<H extends Handler = Handler> = (handler: H) => H;

/**
 * Helper type to infer the middleware's handler argument request type
 */
export type inferMiddlewareReq<M extends Middleware> = Parameters<
  Parameters<M>[0]
>[0];

/**
 * The handler type. It is the same as the default Next.js handler,
 * but with deeper type inference for request and response.
 */
export type Handler<
  Req extends NextApiRequest = NextApiRequest,
  Res extends NextApiResponse = NextApiResponse<unknown>
> = (req: Req, res: Res) => ReturnType<NextApiHandler>;

/**
 * The middleware callback type.
 */
export type Callback<
  Req extends NextApiRequest = NextApiRequest & Record<string, any>,
  Res extends NextApiResponse = NextApiResponse<any>
> = (req: Req, res: Res, next: Function) => ReturnType<NextApiHandler>;

/**
 * Helper type to infer the callback's request type
 */
export type inferCallbackReq<
  C extends Callback<Req, Res>,
  Req extends NextApiRequest = any,
  Res extends NextApiResponse = any
> = Parameters<C>[0];

/**
 * Helper type to infer the middleware's handler argument request type
 */
export type inferMiddlewareHandler<W extends Middleware> = Parameters<W>[0];

/**
 * Merge values from U into T, replacing types for existing keys in T with the types of U
 */
export type MergeLeft<T, U> = {
  [P in keyof T]: P extends keyof U ? U[P] : T[P];
} & U;

/**
 * Extends the NextApiRequest type with the provided Params type.
 * If T contains a type already in NextApiRequest, the type from T will be used.
 */
export type ExtendedNextApiRequest<
  T,
  Req extends NextApiRequest = NextApiRequest
> = MergeLeft<Req, T> extends NextApiRequest ? MergeLeft<Req, T> : Req & T;

export type MergedNextApiRequest<
  ReqA extends NextApiRequest,
  ReqB extends NextApiRequest
> = MergeLeft<ReqA, ReqB> extends NextApiRequest
  ? MergeLeft<ReqA, ReqB>
  : ReqA & ReqB;
