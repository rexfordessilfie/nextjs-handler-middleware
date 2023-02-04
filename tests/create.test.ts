import test from "ava";
import { createMiddleware } from "../src/create";
import { createMocks } from "node-mocks-http";

test("createMiddleware - runs handler", async (t) => {
  let handlerCallCount = 0;

  const middleware = createMiddleware(async (req, res, next) => {
    await next();
  });

  const httpMock = createMocks({
    method: "GET",
  });

  const httpMockB = createMocks({
    method: "GET",
  });

  const handler = middleware((req, res) => {
    handlerCallCount += 1;
    res.status(200).send("OK");
  });

  await handler(httpMock.req, httpMock.res);
  await handler(httpMockB.req, httpMockB.res);

  t.is(typeof middleware, "function");
  t.is(handlerCallCount, 2);
});

test("createMiddleware - attaches properties to request", async (t) => {
  const middleware = createMiddleware<{ foo: string }>(
    async (req, res, next) => {
      req.foo = "bar";
      await next();
    }
  );

  const httpMock = createMocks({
    method: "GET",
  });

  const handler = middleware((req, res) => {
    t.is(req.foo, "bar"); // test property added by middleware
    res.status(200).send("OK");
  });

  await handler(httpMock.req, httpMock.res);

  t.is(typeof middleware, "function");
});
