# Next.js Handler Middleware 
A simple Next.js API middleware solution! This library was inspired by my desire to learn how to make one with the goal of strong type inference and a modular API.

# Getting Started 🚀
1. First install the library using your favorite package manager:

    **Using NPM**
    ```bash
    npm install nextjs-handler-middleware
    ```
    **Using Yarn**
    ```bash
    yarn add nextjs-handler-middleware
    ```
2. Next, define a middleware function with `createMiddleware`, as follows:

    ```typescript
    // lib/middleware/my-middleware.ts

    export const myMiddleware = createMiddleware<{ requestId: string }>((req, res, next) => {
      // Do something magical...(e.g connect to your database, add a tracer id to the request, etc.)
      
      // Attach any extra properties you desire to the request :)
      req.requestId = uuid.v4();
      
      // Execute the request
      await next();
      
      // Do something to end the process...(e.g log request duration, emit some analytics, etc.)
    })
    ```
3. Finally, wrap the middleware around an Next.js API file:
    ```typescript
    // pages/api/hello.ts
    import { myMiddleware } from "lib/middleware"
    
    export default myMiddleware(function handler(req, res) {
      // Access properties provided by the middleware
      console.log(req.requestId)
      
      // Respond to the request!
      res.status(200).json({ message: "Hello from Next.js API!" })
    })
    ```

# Middleware Features 🧱
## **`createMiddleware`**
  This is the main offering, which supports middleware creation for Next.js API handlers. Define a middleware that performs any arbitrary piece of logic. It provides the handler's `req` and `res`, and a `next` function for executing the wrapped handler.
  
  With the `res` object, you can respond to requests early, and with the `req` object, you can attach extra properties to be used by the handler or by subsequent middleware.
  
  **Example 1: `authMiddleware`**: Ensure a user has been authenticated with next-auth before continuing with request, then attach current user to the request.
  ```typescript
  import { getSession } from "next-auth/react";
  import { Session } from "next-auth";
  
  type RequestParams = { user: Session["user"] }
  type ResponseBody = { message: string, code: "UNAUTHORIZED" }
      
  const authMiddleware = createMiddleware<RequestParams, ResponseBody>(
    async (req, res, next) => {
      const user = getSession({ req })
        .then((session) => session.user)
        .catch((error) => {
          console.log(error);
        });
   
      if (!user && redirect ) {
        res.status(403).send({ message: "Unauthorized!" });
        return;
      }

      req.user = session.user;
      next();
    }
  );
  ```
  
  **Example 2**: `restrictedRoleMiddleware`: Ensure that a user has the right role to access the API route.
  ```typescript
  import { getSession } from "next-auth/react";
  import { User } from "lib/types";

  const ROLES = {
    guest: "guest",
    user: "user",
    admin: "admin",
    superAdmin: "superAdmin",
  } as const;

  type Role = typeof ROLES[keyof typeof ROLES];
  const ROLE_LEVELS: Record<Role, number> = {
    guest: 0,
    user: 1,
    admin: 2,
    superAdmin: 3,
  };

  type RequestParams = {};
  type ResponseBody = { message: string };
  type RequestDeps = { user?: User };

  const restrictedRoleMiddleware = <R extends Role>(role: R) =>
    createMiddleware<RequestParams, ResponseBody, RequestDeps>(
      async (req, res, next) => {
        const currentUserLevel = ROLE_LEVELS[req.user.role ?? ROLES.guest];
        const requiredLevel = ROLE_LEVELS[role];

        if (currentUserLevel < requiredLevel) {
          res.status(403).send({ message: "Unauthorized operation!" });
          return;
        }

        next();
      }
    );
  ```
## `stackMiddleware` 
  Often times, we want combine and execute multiple middleware within the same request. For this, we can use any of `stackMiddleware`, `chainMiddleware` or `mergeMiddleware` to combine multiple middleware together.
  Building from the example above, we can see that the `restrictedRoleMiddleware` depends on the `authMiddleware` which sets the current user of the request as a request parameter.
  We can combine the above middleware using `stackMiddleware` for example in the following way:
  
  **Example**: Restricted Middleware per User Role
  
  ```typescript
  import { stackMiddleware } from "nextjs-handler-middleware"
  import { authMiddleware, restrictedRoleMiddleware } from "lib/middleware"
  
  const userRestrictedMiddleware = stackMiddleware(authMiddleware).add(restrictedRoleMiddleware("user"));
  const adminRestrictedMiddleware = stackMiddleware(authMiddleware).add(restrictedRoleMiddleware("admin"));
  const superAdminRestrictedMiddleware = stackMiddleware(authMiddleware).add(restrictedRoleMiddleware("superAdmin"));
  ```
  Now, we can apply these middleware to different handler routes as necessary!
  
  ## `chainMiddleware`
  As above, `chainMiddleware` is also is used to combine middleware. In fact it has exactly the same usage pattern as `stackMiddleware`, except that the middleware are executed in the opposite order.
  
  In other words, the definitions above are equivalent to:
  ```typescript
  import { chainMiddleware } from "nextjs-handler-middleware"
  import { authMiddleware, restrictedRoleMiddleware } from "lib/middleware"
  
  const userRestrictedMiddleware = chainMiddleware(restrictedRoleMiddleware("user")).add(authMiddleware);
  const adminRestrictedMiddleware = chainMiddleware(restrictedRoleMiddleware("admin")).add(authMiddleware);
  const superAdminRestrictedMiddleware = chainMiddleware(restrictedRoleMiddleware("admin")).add(authMiddleware);
  ```
  
  In general, `stackMiddleware` is more erognomic - we add onto the back, versus at the front with `chainMiddleware`.
  
## `mergeMiddleware`
This is another way to combine multiple middleware. It takes in two middleware and combines them into one. Both `stackMiddleware` and `chainMiddleware` are built on top of `mergeMiddleware`, so you may not need to use `mergeMiddleware` directly!

Again, we can express the above middleware as:
```typescript
import { chainMiddleware } from "nextjs-handler-middleware"
import { authMiddleware, restrictedRoleMiddleware } from "lib/middleware"

const userRestrictedMiddleware = mergeMiddleware(authMiddleware, restrictedRoleMiddleware("user"));
const adminRestrictedMiddleware = mergeMiddleware(authMiddleware, restrictedRoleMiddleware("admin"));
const superAdminRestrictedMiddleware = mergeMiddleware(authMiddleware, restrictedRoleMiddleware("superAdmin"));
```

NB: Unlike `stackMiddleware` and `chainMiddleware`, `mergeMiddleware` does not have a `.add()` function for extending it. Though, you could extend it as follows if you wanted to:
```typescript
import { mergeMiddleware } from "nextjs-handler-middleware"
import { m1, m2, m3, m4 } from "lib/middleware"

const mySuperMergedMiddleware = mergeMiddleware(mergeMiddleware(mergeMiddleware(m1, m2), m3), m4); // ...ad infinitum
```

## `createHandler`
This is the last and newly added package functions! Sometimes, you may want to execute certain middleware for only certain request methods. When this is the case, `createHandler` provides a simple way to express that functionality:

**Example: Only Users can POST, Only Admins can Delete, Everyone can Read

```typescript
// pages/api/hello.ts
import { userRestrictedMiddleware, adminRestrictedMiddleware } from "lib/middleware";

const handler = createHandler({
  middleware: {
    post: userRestrictedMiddleware,
    delete: adminRestrictedMiddleware,
  },
});

handler.get((req, res: NextApiResponse<{ message: string }>) => {
  res.status(200).send({ message: "Hello Everyone!" });
});

handler.post((req, res: NextApiResponse<{ message: string; user?: User }>) => {
  res.status(200).send({ message: "Hello user!", user: req.user });
});

handler.delete(
  (req, res: NextApiResponse<{ message: string; user?: User }>) => {
    res.status(200).send({ message: "Hello admin!", user: req.user });
  }
);

export default handler;
```

# Ideas and Use-Cases 💡

## Request Logging
```ts
import { NextApiRequest, NextApiResponse } from "next";
import { createMiddleware } from "../../../../dist";

export const loggingMiddleware = createMiddleware(
  async (req, res: NextApiResponse<{ message: string }>, next) => {
    console.log(`[${req.method}] ${req.url} started`);

    try {
      await next();
      console.log(
        `[${req.method}] ${req.url} completed (${Date.now() - req.startTime}ms)`
      );
    } catch (e) {
      console.error(
        `[${req.method}] ${req.url} errored (${Date.now() - req.startTime}ms)`,
        e
      );
      res.status(500).send({ message: "Request failed" });
    }
  }
);
```

## Database Connections (Mongoose)
```ts
import { NextApiRequest, NextApiResponse } from "next";
import { createMiddleware } from "nextjs-handler-middleware";

import { dbConnect } from "lib/dbConnect"; // Source: https://github.com/vercel/next.js/blob/canary/examples/with-mongodb-mongoose/lib/dbConnect.js

export const dbConnectMiddleware = createMiddleware(
  async (req, res: NextApiResponse<{ message: string }>, next) => {
    await dbConnect();
    next();
  }
);
```


## Request Body Validation (with Zod)
```ts
import { createMiddleware } from "nextjs-handler-middleware";
import { z } from "zod";

export function bodyValidatorMiddleware<S extends z.Schema>(schema: S) {
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

**Caveat:** For this, we only want to apply it to POST/PATCH/PUT requests where we expect to receive a request body. Here, we can leverage `createHandler` to selectively apply the middleware.
```typescript
//pages/api/user/[id].ts
import { createHandler, stackMiddleware } from "nextjs-auth-middleware";
import { userRestrictedMiddleware } from "lib/middleware";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  username: z.string().min(4),
  age: z.number().positive(),
});

const userUpdateSchema = userSchema.partial();

const baseMiddleware = stackMiddleware(loggerMiddleware).add(dbConnectMiddleware).add(authMiddleware)

const handler = createHandler({
  middleware: {
    default: baseMiddleware,
    post: baseMiddleware.add(bodyValidatorMiddleware(userUpdateSchema)),
  },
});

handler.post(async (req, res) => {
  const updatedUser = await updateUserById(req.query.id, req.body);
  // req.body: { email: ..., username: ..., age: ...}
  
  res.status(200).json({
    message: `User updated!`,
    updatedUser 
  });
});

handler.get(async (req, res) => {
  const user = await getUserById(req.query.id);
  res.status(200).json({
    message: "Hello World",
  });
});

export default handler;
```

## With Other Next.js 3rd-party Handlers (e.g TRPC, NextAuth)

**TRPC**
```typescript
// pages/api/trpc/[trpc].ts

import * as trpcNext from '@trpc/server/adapters/next';
import { withDbConnect } from 'lib';
import { createContext } from 'server/context';
import { appRouter } from '../../../server/routers/_app';

const middleware = stackMiddleware(loggerMiddleware).add(dbConnectMiddleware)

export default middleware(
  trpcNext.createNextApiHandler({
    router: appRouter,
    createContext,
  })
);
```

**Next-Auth/Auth.js**
```typescript
// pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { JwtPayload } from 'lib/next-auth';

const middleware = stackMiddleware(loggerMiddleware).add(dbConnectMiddleware);

import NextAuth from 'next-auth';
import GithubProvider from 'next-auth/providers/github';

export default middleware(
  NextAuth({
    providers: [
      GithubProvider({
        clientId: process.env.GITHUB_ID,
        clientSecret: process.env.GITHUB_SECRET,
      }),
    ],
  })
);
```

# Notes on Types 📝
### Merge-Left Request Parameters 
When two middleware, A and B are combined, the request type of B is left-merged into the request type of A. In other words, all types in B add to or override the types in A.

To understand "merge-left" consider the following scenario:
```typescript
type A = { body: any; foo: string };
type B = { body: { name: string }; bar: string };

type C = MergeLeft<A, B>; 
//   ^? { body: { name: string }, foo: string, bar: string }
```
This is what makes the inferred types of the request body validator above work as intended when we combine it with other validators. The default
'any' type of Next.js request body is overridden by the type of body inferred from the zod validator.

Ideally, instead of a merge-left, a "specific-merge", which either merges left, or chooses the most specific of the types involved in the merge would be ideal. In the example above, swapping the order of the merge with a regular merge-left causes us to loose the specificity of the body type, whereas a "specific" merge would not.

```typescript
type A = { body: any; foo: string };
type B = { body: { name: string }; bar: string };

type C = MergeLeft<B, A>; 
//   ^? { body: any, foo: string, bar: string }
```  
> I am stilling exploring a solution for a "specific" merge, which should make the type-inference more resilient. For now, middleware that 
define the types of Next.js request fields which are (`any` or `unknown`) such as `body`, must be the last middleware in the stack for its specific types to make it down to the handler.


### Optional Request Parameters
Middleware may attach typed parameters to a request. By default, types for middleware request parameters
added via `createMiddleware`'s generics are made optional.

I made this decision as a safety net to gaurd against not attaching the specified properties to the request.

For example consider the following where we do not set the `emoji` parameter, even though we said we would in the type:

```typescript
type RequestParams = { emoji: string }
const middleware = createMiddleware<RequestParams>(
  async (req, res, next) => {
    await next();
});
```

When this middleware is used, the resulting type of `emoji` in the handler is made optional.

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
> In the future, I would love to explore extending something such as eslint, or the typescript compiler type-checker to automatically check that all middleware request parameter extensions are set in the middleware as a way to prevent the possibility of such bugs. I would love to see a contribution that addresses this!
