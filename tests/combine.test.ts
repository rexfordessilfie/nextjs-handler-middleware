import test from "ava";
import { createMocks } from "node-mocks-http";
import {
  chainMiddleware,
  createMiddleware,
  mergeMiddleware,
  stackMiddleware,
} from "../src";

test("mergeMiddleware - runs in correct order", async (t) => {
  const order: string[] = [];
  const middlewareA = createMiddleware(async (req, res, next) => {
    await next();
    order.push("A handler ran");
  });

  const middlewareB = createMiddleware(async (req, res, next) => {
    await next();
    order.push("B handler ran");
  });

  const httpMock = createMocks({
    method: "GET",
  });

  const middleware = mergeMiddleware(middlewareA, middlewareB);

  const handler = middleware((req, res) => {
    res.status(200).send("OK");
  });

  await handler(httpMock.req, httpMock.res);

  t.is(httpMock.res._getStatusCode(), 200);
  t.is(httpMock.res._getData(), "OK");
  t.deepEqual(order, ["B handler ran", "A handler ran"]);
});

test("stackMiddleware - runs in correct order", async (t) => {
  const order: string[] = [];
  const middlewareA = createMiddleware(async (req, res, next) => {
    await next();
    order.push("A handler ran");
  });

  const middlewareB = createMiddleware(async (req, res, next) => {
    await next();
    order.push("B handler ran");
  });

  const middlewareC = createMiddleware(async (req, res, next) => {
    await next();
    order.push("C handler ran");
  });

  const httpMock = createMocks({
    method: "GET",
    query: {
      foo: "bar",
    },
  });

  const middleware = stackMiddleware(middlewareA)
    .add(middlewareB)
    .add(middlewareC);

  const handler = middleware((req, res) => {
    res.status(200).send("OK");
  });

  await handler(httpMock.req, httpMock.res);

  t.is(httpMock.res._getStatusCode(), 200);
  t.is(httpMock.res._getData(), "OK");
  t.deepEqual(order, ["C handler ran", "B handler ran", "A handler ran"]);
});

test("chainMiddleware - runs in correct order", async (t) => {
  const order: string[] = [];
  const middlewareA = createMiddleware(async (req, res, next) => {
    await next();
    order.push("A handler ran");
  });

  const middlewareB = createMiddleware(async (req, res, next) => {
    await next();
    order.push("B handler ran");
  });

  const middlewareC = createMiddleware(async (req, res, next) => {
    await next();
    order.push("C handler ran");
  });

  const httpMock = createMocks({
    method: "GET",
  });

  const middleware = chainMiddleware(middlewareA)
    .add(middlewareB)
    .add(middlewareC);

  const handler = middleware((req, res) => {
    res.status(200).send("OK");
  });

  await handler(httpMock.req, httpMock.res);

  t.is(httpMock.res._getStatusCode(), 200);
  t.is(httpMock.res._getData(), "OK");
  t.deepEqual(order, ["A handler ran", "B handler ran", "C handler ran"]);
});
