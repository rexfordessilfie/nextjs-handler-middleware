import {
  AnyWrapper,
  Handler,
  inferWrapperHandler,
  inferWrapperReq,
} from "./types";

/**
 * Merges two Next.js API wrappers into one (wrappers applied from right-to-left)
 * @param a - the outer wrapper
 * @param b - the inner wrapper
 * @returns
 */
export const mergeWrappers =
  <A extends AnyWrapper, B extends AnyWrapper>(a: A, b: B) =>
  (handler: Handler<inferWrapperReq<A> & inferWrapperReq<B>>) => {
    return a(b(handler));
  };

/**
 * Merges two Next.js API wrappers into one (wrappers applied from right-to-left)
 * @param a - the outer wrapper
 * @param b - the inner wrapper
 * @returns
 */
export const stackWrappers = <A extends AnyWrapper>(a: A) => {
  const finalHandler = (handler: inferWrapperHandler<A>) => {
    return a(handler);
  };

  finalHandler.use = <B extends AnyWrapper>(b: B) =>
    stackWrappers(mergeWrappers(a, b));

  return finalHandler;
};

/**
 * Chains two Next.js API wrappers into one (wrappers applied from left-to-right)
 * @param a - the inner wrapper
 * @returns
 */
export const chainWrappers = <A extends AnyWrapper>(a: A) => {
  const finalHandler = (handler: inferWrapperHandler<A>) => {
    return a(handler);
  };

  finalHandler.use = <B extends AnyWrapper>(b: B) =>
    chainWrappers(mergeWrappers(b, a));

  return finalHandler;
};

// or just use a withSelect middleware that takes a handler as argument and executes it depending som
// selection criteria...

// Or looks like this? TODO
// thing.use().use().method(..., (req, res) => {}).method(..., (req, res) => {})
// createHandler<Wrapper>() -> give you handler with typed req and res
