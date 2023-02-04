import {
  AnyMiddleware,
  MergeLeft,
  Handler,
  inferMiddlewareHandler,
  inferMiddlewareReq,
} from "./types";

/**
 * Merges two Next.js API middleware into one (middleware applied from right-to-left)
 * @param a - the outer middleware
 * @param b - the inner middleware
 * @returns
 */
export const mergeMiddleware =
  <A extends AnyMiddleware, B extends AnyMiddleware>(a: A, b: B) =>
  (
    handler: Handler<MergeLeft<inferMiddlewareReq<A>, inferMiddlewareReq<B>>>
  ) => {
    return a(b(handler));
  };

/**
 * Merges two Next.js API middleware into one (middleware applied from right-to-left)
 * @param a - the last middleware to be applied
 * @returns
 */
export const stackMiddleware = <M1 extends AnyMiddleware>(middlewareA: M1) => {
  const newHandler = (handler: inferMiddlewareHandler<M1>) => {
    return middlewareA(handler);
  };

  newHandler.kind = "stack" as "stack";

  newHandler.add = <M2 extends AnyMiddleware>(middlewareB: M2) =>
    stackMiddleware(mergeMiddleware(middlewareA, middlewareB));

  return newHandler;
};

/**
 * Chains two Next.js API middleware into one (middleware applied from left-to-right)
 * @param middlewareA - the firs middleware to be applied
 * @returns
 */
export const chainMiddleware = <M1 extends AnyMiddleware>(middlewareA: M1) => {
  const newHandler = (handler: inferMiddlewareHandler<M1>) => {
    return middlewareA(handler);
  };

  newHandler.kind = "chain" as "chain";

  newHandler.add = <M2 extends AnyMiddleware>(middlewareB: M2) =>
    chainMiddleware(mergeMiddleware(middlewareB, middlewareA));

  return newHandler;
};
