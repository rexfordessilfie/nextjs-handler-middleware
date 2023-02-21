# nextjs-handler-middleware
A simple Next.js middleware library! I made this library because I wanted to learn how to make one, and with a goal of strong type inference and modular APIs.

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

### Usage: **`loggerMiddleware`**

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
In the advanced usage, individual middleware can be merged together in a modular fashion to create more complex middleware. Here are the options for merging different middleware together:

## `mergeMiddleware`
With `mergeMiddleware`, you can combine two middleware together into one. The type of the request object for the handler is inferred from the combination of the request types of the two middleware.

### Usage
1. Define an additional middleware to the logger middleware above, for example a `dbConnectMiddleware` for establishing db connections before each request:
  
**Middleware 2: `dbConnectMiddleware`**
```ts
// lib/db-middleware.ts
export const dbConnectMiddleware = createMiddleware(async (req, res, next) => {
  await dbConnect();
  await next();
});
```

2. Now merge the two middleware together into one middleware to bring together both the logging and db connection functionality:

```ts
// pages/api/hello.ts
import { mergeMiddleware } from "nextjs-handler-middleware";

import { loggerMiddleware, dbConnectMiddleware } from "./middleware";

export const middleware = mergeMiddleware(loggerMiddleware, dbConnectMiddleware);

export default middleware(async (req, res) => {
  res.status(200).send({ message: "Hello World!", startTime: req.startTime });
});
```

Under the hood, the middleware are applied as follows:
```typescript
loggerMiddleware(dbConnectMiddleware(handler))
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

1. We will define another middleware, `authMiddleware`, that checks for a user cookie and attaches the user to the request object:

**Middleware 3: `authMiddleware`**
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

2. Assemble different middleware into a single public middleware, and then extend the public middleware with the auth middleware to create a protected middleware:
```ts
// lib/middleware.ts
import { stackMiddleware } from "nextjs-handler-middleware";

import { loggerMiddleware } from "./logger-middleware";
import { authMiddleware } from "./auth-middleware";
import { dbConnectMiddleware } from "./db-middleware";

export const publicMiddleware = stackMiddleware(loggerMiddleware).add(dbConnectMiddleware);
export const protectedMiddleware = publicMiddleware.add(authMiddleware);
```

3. Now, for public Next.js API routes, we can use the `publicMiddleware` to wrap them, and for private Next.js API routes, we can use the `protectedMiddleware` to wrap them instead to secure such routes.

**Public API Routes**
```ts
// pages/api/hello.ts
import { publicMiddleware } from "../../lib/middleware";

export default publicMiddleware(async function handler (req, res) {
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

## `createMiddleware` + `zod` Request Validation
In addition to the examples above, you can also perform request validation using the middleware, and
then have strong type definitions for the request body for post requests.

1. Define the body validator middleware
```ts
// lib/validate-body-middleware.ts
import { z } from "zod";
import { createMiddleware } from "nextjs-handler-middleware";

export function bodyValidatorMiddleware<S extends z.Schema>(schema: S) {
  return createMiddleware<{ body: z.infer<S> }>((req, res, next) => {
    const shouldValidateBody = req.method && /post/i.test(req.method);
    
    if (!shouldValidateBody) {
      next();
      return;
    }

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

## `createHandler`
The `createHandler` function can be used to create a NextJS API handler with specific handlers for each request method. It supports a `middleware` configuration option that let's you specify middleware to be executed for each request method.

### Usage: `createHandler` + Protected and Public Routes per Method
```ts
// pages/api/hello.ts
import { createHandler } from "nextjs-handler-middleware";
import { protectedMiddleware, publicMiddleware } from "../../lib/middleware";

const handler = createHandler({
  middleware: {
    get: publicMiddleware,
    post: protectedMiddleware,
  },
})

handler.get((req, res) => {
  res.status(200).send({ message: `Hello from public route!` });
})

handler.post((req, res) => {
  res.status(200).send({ message: `Hello from protected route!`, user: req.user });
})

export default handler;
```

## Directly Invoking Middleware
The middleware can be invoked directly inside of a handler if necessary. 

When a middleware is invoked, it returns a new handler that encapsulates both the middleware's logic and the supplied handler's logic. Invoking this returned handler with request and response objects will actually fulfill the request.

Executing middleware manually is useful when we want to apply middleware under certain select criteria, for example based on the request method. Here we only want to authenticate for POST requests for example:

```ts
// pages/api/hello.ts
import { z } from "zod";
import {
  authMiddleware,
  publicMiddleware,
} from "../../lib/middleware";

const schema = z.object({
  name: z.string(),
});

// Wrap entire handler in public middleware for logging + db connection.
export default publicMiddleware(function handler (req, res) {
  if (req.method === "POST") {
    // If POST, create a new handler that performs authentication
    // before executing the supplied handler
    const postHandler = authMiddleware((req, res) => {
      // Responding to the POST request
      res.status(200).send({ message: `hello ${req.body?.name}` });
    });
    // Invoke the new handler to execute both the auth middleware and the handler
    postHandler(req, res);
  } else {
    // Otherwise respond to the GET request
    res.status(200).send({ message: `hello world!` });
  }
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
