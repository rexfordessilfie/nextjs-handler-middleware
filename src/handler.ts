import { NextApiRequest, NextApiResponse } from "next";
import { HTTP_METHODS } from "./constants";
import {
  AnyHandler,
  AnyMiddleware,
  CreateHandlerConfig,
  GenericHandler,
  InferCreateHandlerConfig,
  InferMiddlewareHandler
} from "./types";

export const createHandler = <
  Config extends CreateHandlerConfig = CreateHandlerConfig
>(
  config?: Config
) => {
  let _post: AnyHandler;
  let _get: AnyHandler;
  let _patch: AnyHandler;
  let _put: AnyHandler;
  let _delete: AnyHandler;

  const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const methodMap = {
      [HTTP_METHODS.POST]: _post,
      [HTTP_METHODS.PUT]: _put,
      [HTTP_METHODS.PATCH]: _patch,
      [HTTP_METHODS.DELETE]: _delete,
      [HTTP_METHODS.GET]: _get
    };

    const method = req.method?.toUpperCase();

    if (!method) {
      res.status(500).json({ message: "Missing request method!" });
      return;
    }

    const methodHandler = methodMap[method as keyof typeof methodMap];

    if (!methodHandler) {
      res.status(405).json({ message: "Unsupported method!" });
      return;
    }

    methodHandler(req, res);
  };

  // Register post handler
  handler.post = <Req = NextApiRequest, Res = NextApiResponse>(
    h: InferCreateHandlerConfig<Config, "post"> extends AnyMiddleware
      ? InferMiddlewareHandler<InferCreateHandlerConfig<Config, "post">>
      : GenericHandler<Req, Res>
  ) => {
    const middleware = config?.middleware?.post || config?.middleware?.default;
    _post = middleware ? middleware(h) : h;
    return handler;
  };

  // Register get handler
  handler.get = <Req = NextApiRequest, Res = NextApiResponse>(
    h: InferCreateHandlerConfig<Config, "get"> extends AnyMiddleware
      ? InferMiddlewareHandler<InferCreateHandlerConfig<Config, "get">>
      : GenericHandler<Req, Res>
  ) => {
    const middleware = config?.middleware?.get || config?.middleware?.default;
    _get = middleware ? middleware(h) : h;
    return handler;
  };

  // Register patch handler
  handler.patch = <Req = NextApiRequest, Res = NextApiResponse>(
    h: InferCreateHandlerConfig<Config, "patch"> extends AnyMiddleware
      ? InferMiddlewareHandler<InferCreateHandlerConfig<Config, "patch">>
      : GenericHandler<Req, Res>
  ) => {
    const middleware = config?.middleware?.patch || config?.middleware?.default;
    _patch = middleware ? middleware(h) : h;
    return handler;
  };

  // Register put handler
  handler.put = <Req = NextApiRequest, Res = NextApiResponse>(
    h: InferCreateHandlerConfig<Config, "put"> extends AnyMiddleware
      ? InferMiddlewareHandler<InferCreateHandlerConfig<Config, "put">>
      : GenericHandler<Req, Res>
  ) => {
    const middleware = config?.middleware?.put || config?.middleware?.default;
    _put = middleware ? middleware(h) : h;
    return handler;
  };

  // Register delete handler
  handler.delete = <Req = NextApiRequest, Res = NextApiResponse>(
    h: InferCreateHandlerConfig<Config, "delete"> extends AnyMiddleware
      ? InferMiddlewareHandler<InferCreateHandlerConfig<Config, "delete">>
      : GenericHandler<Req, Res>
  ) => {
    const middleware =
      config?.middleware?.delete || config?.middleware?.default;
    _delete = middleware ? middleware(h) : h;
    return handler;
  };

  return handler;
};
