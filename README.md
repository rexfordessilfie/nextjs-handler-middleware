# next-handler-middleware
Yet another Next.js middleware library! I made this library because I wanted to learn how to make one, and also to aim for as strong type safety and flexibility as possible.

# Installation
_In Progress: to be published!_

# Usage

## Basic Usage
1. Define your middleware
```ts
// lib/logger-middleware.ts

import { createMiddleware } from "next-handler-middleware";

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


## Advanced Usage
Here, we are able to compose several middleware together in a reusable manner. We can develop a base middleware that is used by all routes (e.g for things such as connecting a database, logging requests, rate-limiting etc.), and then extend it with additional middleware for specific routes (e.g for request validation, or pay-walls etc.)

1. Define additional middleware, for example for protected routes

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
import { stackMiddleware } from "next-handler-middleware";

import { loggerMiddleware } from "./logger-middleware";
import { authMiddleware } from "./auth-middleware";

export const baseMiddleware = stackMiddleware(loggerMiddleware);
export const protectedMiddleware = baseMiddleware.add(authMiddleware);
```

3. Use the middleware in your Next.js API route

```ts
// pages/api/hello.ts
import { protectedMiddleware } from "../../lib/middleware";

export default protectedMiddleware(async function handler (req, res) {
  res.status(200).send({ message: `hello ${req.user.id}` }); // req.user is defined and strongly typed by middleware
});
```

## Request Validation
In addition to the examples above, you can also perform request validation using a middleware, and
then have strong type definitions for the request body.

1. Define the validator body middleware

```ts
// lib/validate-body-middleware.ts

import {z} from "zod";
import {createMiddleware} from "next-handler-middleware";

export const validateBodyMiddleware = (schema: z.Schema) => createMiddleware<
  { body: z.infer<typeof schema> },
  { message: string }
>(async (req, res, next) => {
  try{
    req.body = schema.parse(req.body);
      await next();
  }catch(e){
    res.status(400).send({ message: "invalid request body", error: e });
  }
});
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

# A Note on Types
The types strategy on this branch automatically makes all middleware request parameter extensions optional to 
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
