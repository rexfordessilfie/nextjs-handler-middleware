# next-handler-middleware
Yet another Next.js middleware library! I made this library because I wanted to learn how to make one, and also to aim for as strong type safety and flexibility as possible.

# Installation
```sh 
npm install next-handler-middleware
```

# Usage

## Basic Usage
1. Define your middleware
```ts
// lib/logger-middleware.ts
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
