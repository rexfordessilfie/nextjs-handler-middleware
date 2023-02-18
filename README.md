# nextjs-handler-middleware
A simple Next.js middleware library! I made this library because I wanted to learn how to make one, and also to aim for as strong type inference and modular APIs.

# Installation
```bash
npm install nextjs-handler-middleware
```

Or if you are using yarn:
```bash
yarn add nextjs-handler-middleware
```

# Usage
## `createMiddleware`
Using `createMiddleware` you can create a middleware that can be used in a Next.js API route. It receives a callback argument that has a `next()` function that you can call to continue to the execution of the handler that is being wrapped by the middleware.

### Usage: Logging Middleware

1. Define your middleware
```ts
// lib/logger-middleware.ts

import { createMiddleware } from "nextjs-handler-middleware";

export const loggerMiddleware = createMiddleware<
  { startTime: number },
  { message: string }
>(async (req, res, next) => {
  console.log("request started!");

  const start = Date.now();
  req.startTime = start;

  try {
    await next();
    console.log("request succeeded!");
  } catch (e) {
    res.status(500).send({ message: "request failed" });
    console.log("request failed with error");
  }

  const stop = Date.now();
  console.log("duration (ms):", stop - start);
});
```

2. Use it in your Next.js API route
```ts
// pages/api/hello.ts
import { loggerMiddleware } from "../../lib/logger-middleware";

export default loggerMiddleware(async (req, res) => {
  res.status(200).send({ message: "hello world" });
});
```

# Advanced Usage
This base middleware can be extended to create more complex middleware by merging them together in a modular fashion.

## `mergeMiddleware`
With `mergeMiddleware`, you can combine two middleware together into one.

### Usage
```ts
// pages/api/hello.ts
import { mergeMiddleware } from "nextjs-handler-middleware";

import { loggerMiddleware, dbConnectionMiddleware } from "./middleware";

export const middleware = mergeMiddleware(loggerMiddleware, dbConnectionMiddleware);

export default middleware(async (req, res) => {
  res.status(200).send({ message: "hello world!" });
});
```
Under the hood, the middleware are applied as follows:
```typescript
loggerMiddleware(dbConnectionMiddleware(handler))
```

## `stackMiddleware`
With `stackMiddleware`, you can compose multiple middleware together into a single middleware. This builds directly on top of `mergeMiddleware` and attaches a `add` method to the middleware that allows you to add infinite middleware to the stack!

For example, given:
```typescript
const middleware = stackMiddleware(middlewareA).add(middlewareB);

middleware(handler);
```

The middleware will be applied as follows:
```typescript
middlewareA(middlewareB(handler))
```


### Usage

1. Define additional middleware, for example for protected routes:

**Middleware 1: `dbMiddleware`**
```ts
// lib/db-middleware.ts
export const dbMiddleware = createMiddleware(async (req, res, next) => {
  await dbConnect();
  await next();
});
```

**Middleware 2: `authMiddleware`**
```ts
// lib/auth-middleware.ts
export const authMiddleware = createMiddleware<
  { user: { id: string } },
  { message: string }
>(async (req, res, next) => {
  const user = await getUserFromCookie(req.cookies);
  if (!user) {
    res.status(401).send({ message: "unauthorized" });
    return;
  }

  req.user = user;
  await next();
});
```

2. Assemble different middleware into a single middleware and extend it with additional middleware
```ts
// lib/middleware.ts
import { stackMiddleware } from "nextjs-handler-middleware";

import { loggerMiddleware } from "./logger-middleware";
import { authMiddleware } from "./auth-middleware";
import { dbMiddleware } from "./db-middleware";

export const baseMiddleware = stackMiddleware(loggerMiddleware).add(dbMiddleware);
export const protectedMiddleware = baseMiddleware.add(authMiddleware);
```

1. Use the middleware in your Next.js API routes

**Public API Routes**
```ts
// pages/api/hello.ts
import { baseMiddleware } from "../../lib/middleware";

export default baseMiddleware(async function handler (req, res) {
  res.status(200).send({ message: `hello world!` });
});
```

**Private API Routes**
```ts
// pages/api/admin.ts
import { protectedMiddleware } from "../../lib/middleware";

export default protectedMiddleware(async function handler (req, res) {
  res.status(200).send({ message: `hello ${req.user.id}` }); // req.user is defined and strongly typed by middleware
});
```

## `chainMiddleware`
This is very similar to `stackMiddleware`, except that it applies the middleware in the opposite order, i.e the first one added will be the first one applied.

For example, given:
```typescript
const middleware = chainMiddleware(middlewareA).add(middlewareB);

middleware(handler);
```

The middleware will be applied as follows:
```typescript
middlewareB(middlewareA(handler))
```

## Middleware + Zod Request Validation
In addition to the examples above, you can also perform request validation using the middleware, and
then have strong type definitions for the request body.

1. Define the validator body middleware
```ts
// lib/validate-body-middleware.ts
import {z} from "zod";
import { createMiddleware } from "nextjs-handler-middleware";

export function validateBodyMiddleware<S extends z.Schema>(schema: S) {
  return createMiddleware<{ body: z.infer<S> }>((req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (parsed.success) {
      req.body = parsed.data;
      next();
    } else {
      res.status(400).json({
        message: `Invalid request body`,
        code: "BAD_FORMAT",
      });
    }
  });
}
```

2. Use the middleware in your Next.js API route

```ts
// pages/api/hello.ts
import { protectedMiddleware } from "../../lib/middleware";
import { validateBodyMiddleware } from "../../lib/validate-body-middleware";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
});

const middleware = protectedMiddleware.add(validateBodyMiddleware(schema));

export default middleware(async function handler (req, res) {
    res.status(200).send({ message: `hello ${req.body.name}` }); // req.body is defined and strongly typed by middleware
  });
```

## A Note on Handler Request Parameter Types
The types strategy in this package automatically makes all middleware request parameter extensions optional to 
guard against mistakes such as forgetting to set the parameter in the middleware. For example consider the
following where we forget to set the `emoji` parameter:

```typescript
const middleware = createMiddleware<
  { emoji: string },
  { message: string }
>(async (req, res, next) => {
  await next();
});
```

When we use this middleware in a handler, the `emoji` parameter will be optional and typescript should complain if we try to do stuff with it. This should help prevent bugs where you possibly forget to set the parameter in the middleware.
```typescript
const handler = middleware(async (req, res) => {
  res.status(200).send({ message: `hello ${req.emoji.toString()}` }); // req.emoji is possibly undefined
});
```

If you find this troublesome, you can always fallback to explicitly defining the request parameter type so that it is not optional when used in the handler:
```typescript
const middleware = createMiddleware(async (req: NextApiRequest & { emoji: string }, res, next) => {
  req.emoji = "👋";
  await next();
});
```
In the future, I would love to explore extending something such as eslint, or the typescript compiler type-checker to automatically check that all middleware request parameter extensions are set in the middleware as a way to prevent the possibility of such bugs.
