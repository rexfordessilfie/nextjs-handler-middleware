import test from "ava";
import { createHandler } from "../src/handler";
import { createMocks } from "node-mocks-http";
import { createMiddleware } from "../src/create";

test("createHandler - runs GET method with middleware", async (t) => {
  const { req, res } = createMocks({
    method: "GET",
  });

  const middleware = createMiddleware<{ foo: "bar" | "baz" }>(
    (req, res, next) => {
      req.foo = "bar";
      next();
    }
  );

  const handler = createHandler({
    middleware: {
      get: middleware,
    },
  });

  handler.get(async (req, res) => {
    res.status(200).send(req.foo);
  });

  handler(req, res);

  t.is(res._getStatusCode(), 200);
  t.is(res._getData(), req.foo);
});

test("createHandler - runs POST method", async (t) => {
  const { req, res } = createMocks({
    method: "POST",
  });

  const middleware = createMiddleware<{ foo: "bar" | "baz" }>(
    (req, res, next) => {
      req.foo = "bar";
      next();
    }
  );

  const handler = createHandler({
    middleware: {
      post: middleware,
    },
  });

  handler.post(async (req, res) => {
    res.status(200).send(req.foo);
  });

  handler(req, res);

  t.is(res._getStatusCode(), 200);
  t.is(res._getData(), req.foo);
});

test("createHandler - runs PUT method", async (t) => {
  const { req, res } = createMocks({
    method: "PUT",
  });

  const middleware = createMiddleware<{ foo: "bar" | "baz" }>(
    (req, res, next) => {
      req.foo = "bar";
      next();
    }
  );

  const handler = createHandler({
    middleware: {
      put: middleware,
    },
  });

  handler.put(async (req, res) => {
    res.status(200).send(req.foo);
  });

  handler(req, res);

  t.is(res._getStatusCode(), 200);
  t.is(res._getData(), req.foo);
});

test("createHandler - runs PATCH method", async (t) => {
  const { req, res } = createMocks({
    method: "PATCH",
  });

  const middleware = createMiddleware<{ foo: "bar" | "baz" }>(
    (req, res, next) => {
      req.foo = "bar";
      next();
    }
  );

  const handler = createHandler({
    middleware: {
      patch: middleware,
    },
  });

  handler.patch(async (req, res) => {
    res.status(200).send(req.foo);
  });

  handler(req, res);

  t.is(res._getStatusCode(), 200);
  t.is(res._getData(), req.foo);
});

test("createHandler - runs DELETE method", async (t) => {
  const { req, res } = createMocks({
    method: "DELETE",
  });

  const middleware = createMiddleware<{ foo: "bar" | "baz" }>(
    (req, res, next) => {
      req.foo = "bar";
      next();
    }
  );

  const handler = createHandler({
    middleware: {
      delete: middleware,
    },
  });

  handler.delete(async (req, res) => {
    res.status(200).send(req.foo);
  });

  handler(req, res);

  t.is(res._getStatusCode(), 200);
  t.is(res._getData(), req.foo);
});

test("createHandler - executes handler with default middleware", async (t) => {
  const { req, res } = createMocks({
    method: "GET",
  });

  const middleware = createMiddleware<{ foo: "bar" | "baz" }>(
    (req, res, next) => {
      req.foo = "bar";
      next();
    }
  );

  const handler = createHandler({
    middleware: {
      default: middleware,
    },
  });

  handler.get(async (req, res) => {
    res.status(200).send(req.foo);
  });

  handler(req, res);

  t.is(res._getStatusCode(), 200);
  t.is(res._getData(), "bar");
});
