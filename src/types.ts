import { NextApiRequest, NextApiResponse, NextApiHandler } from "next";

export type AnyHandler = Handler<any, any>;
export type AnyWrapper<H extends AnyHandler = AnyHandler> = (handler: H) => H;

/**
 * Helper type to infer the wrapper's handler argument request type
 */
export type inferWrapperReq<W extends AnyWrapper> = Parameters<
  Parameters<W>[0]
>[0];

/**
 * The handler type. It is the same as the default Next.js handler,
 * but with deeper type inference for request and response.
 */
export type Handler<
  Req extends NextApiRequest,
  Res extends NextApiResponse = NextApiResponse<unknown>
> = (req: Req, res: Res) => ReturnType<NextApiHandler>;

/**
 * The wrapper callback type.
 */
export type Callback<
  Req extends NextApiRequest,
  Res extends NextApiResponse
> = (req: Req, res: Res, next: Function) => ReturnType<NextApiHandler>;

/**
 * Helper type to infer the callback's request type
 */
export type inferCallbackReq<C extends Callback<any, any>> = Parameters<C>[0];

/**
 * Helper type to infer the wrapper's handler argument request type
 */
export type inferWrapperHandler<W extends AnyWrapper> = Parameters<W>[0];
