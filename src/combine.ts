import {
  Middleware,
  Handler,
  inferMiddlewareHandler,
  inferMiddlewareReq,
  MergedNextApiRequest,
  AnyMiddleware,
} from "./types";

/**
 * Merges two Next.js API middleware into one (middleware applied from right-to-left, i.e b first, then a)
 * @param a - the outer middleware
 * @param b - the inner middleware
 * @returns
 */
export const mergeMiddleware =
  <A extends Middleware, B extends AnyMiddleware>(a: A, b: B) =>
  (
    handler: Handler<
      MergedNextApiRequest<inferMiddlewareReq<A>, inferMiddlewareReq<B>>
    >
  ): typeof handler =>
    a(b(handler));

/**
 * Merges two Next.js API middleware into one (middleware applied from last to first)
 * @param a - the last middleware to be applied
 * @returns
 */
export const stackMiddleware = <M1 extends AnyMiddleware>(middlewareA: M1) => {
  const stackedMiddleware = (
    handler: inferMiddlewareHandler<M1>
  ): typeof handler => middlewareA(handler);

  stackedMiddleware.kind = "stack" as "stack";
  stackedMiddleware.add = <M2 extends AnyMiddleware>(middlewareB: M2) =>
    stackMiddleware(mergeMiddleware(middlewareA, middlewareB));

  return stackedMiddleware;
};

/**
 * Chains two Next.js API middleware into one (middleware applied from first to last)
 * @param middlewareA - the firs middleware to be applied
 * @returns
 */
export const chainMiddleware = <M1 extends AnyMiddleware>(middlewareA: M1) => {
  const chainedMiddleware = (
    handler: inferMiddlewareHandler<M1>
  ): typeof handler => middlewareA(handler);

  chainedMiddleware.kind = "chain" as "chain";
  chainedMiddleware.add = <M2 extends AnyMiddleware>(middlewareB: M2) =>
    chainMiddleware(mergeMiddleware(middlewareB, middlewareA));

  return chainedMiddleware;
};
