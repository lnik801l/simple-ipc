import {
  ExtractIpcMethodArgs,
  ExtractIpcMethodResult,
  IpcClientCallback,
  IpcEvents,
  IpcError,
  IpcMethods,
  IpcServerCallback,
  Awaitable
} from "./types";
import { IpcMessagesResponses, IpcMethodRequest, IpcMethodResponse } from "./types/messages";
import { ExtendedError } from "./errors.js";

type ResponseListener = (callback: (message: IpcMessagesResponses) => Awaitable<void>) => void;

const throwTimeout = 9999999;

function randomUUID(): string {
  const hexDigits = "0123456789abcdef";
  let uuid = "";

  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      uuid += "-";
    } else if (i === 14) {
      uuid += "4"; // UUID version 4
    } else if (i === 19) {
      uuid += hexDigits[(Math.random() * 4) | 8];
    } else {
      uuid += hexDigits[(Math.random() * 16) | 0];
    }
  }

  return uuid;
}

export abstract class AbstractIpcServer<TMethods extends IpcMethods, TEvents extends IpcEvents> {
  private readonly handlers = new Map<keyof TMethods, IpcServerCallback>();

  public constructor(
    protected addRequestListener: <TMethod extends keyof TMethods>(
      callback: (message: IpcMethodRequest<TMethods, TMethod>) => Awaitable<void>
    ) => void,
    protected response: (message: IpcMessagesResponses) => Awaitable<void>
  ) {
    this.addRequestListener(async (message) => {
      if (message.type != "ipc::request" || !message.method) return;

      const handler = this.handlers.get(message.method);

      if (!handler) {
        return this.response({
          id: message.id,
          type: "ipc::response",
          result: undefined,
          method: message.method,
          error: {
            message: `handler with name ${String(message.method)} does not registered!`,
            stack: "???"
          }
        });
      }

      await handler(message);
    });
  }

  public createHandler<TMethod extends keyof TMethods>(
    method: TMethod,
    callback: (...data: ExtractIpcMethodArgs<TMethods, TMethod>) => Awaitable<ExtractIpcMethodResult<TMethods, TMethod>>
  ) {
    if (this.handlers.get(method)) {
      throw new Error(`method with name ${String(method)} already registered!`);
    }

    this.handlers.set(method, async (message) => {
      let result: ExtractIpcMethodResult<TMethods, TMethod> | undefined = undefined;
      let error: IpcError | undefined = undefined;

      // eslint-disable-next-line no-async-promise-executor
      await new Promise<void>(async (res, rej) => {
        const timeout = setTimeout(
          () => rej(new ExtendedError("timeout", `handler timeout ${method as string}`)),
          throwTimeout
        );

        try {
          result = await callback(...message.params);
          // serialization lifehack for proxies etc.
          if (result) result = JSON.parse(JSON.stringify(result));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          console.error(e);
          error = {
            message: e?.message ?? "no message",
            stack: e?.stack ?? "???",
            description: e?.description
          };
        }

        const response: IpcMethodResponse<TMethods, TMethod> = {
          id: message.id,
          type: "ipc::response",
          method: message.method as TMethod & string,
          error,
          result
        };

        clearTimeout(timeout);
        await this.response(response);
        res();
      });
    });
  }

  public sendError(error: IpcError) {
    this.response({
      type: "ipc::error",
      error: error
    });
  }

  public abstract emit<TEvent extends keyof TEvents>(event: TEvent, ...data: TEvents[TEvent]): void;
}

export abstract class AbstractIpcClient<TMethods extends IpcMethods, TEvents extends IpcEvents> {
  private handlers = new Map<`${keyof TMethods & string}_${string}`, IpcClientCallback>();
  protected errorHandler: ((e: IpcError) => void) | undefined = undefined;

  public constructor(
    protected request: <TMethod extends keyof TMethods>(
      message: IpcMethodRequest<TMethods, TMethod>
    ) => Awaitable<void>,
    protected listen: ResponseListener,
    protected listenResponse?: () => void,
    protected listenError?: () => void
  ) {
    listenResponse
      ? listenResponse()
      : listen(async (message) => {
          if (message.type != "ipc::response" || !message.method) return;
          const handler = this.handlers.get(`${message.method as string}_${message.id}`);
          if (!handler) return console.warn(`called method ${message.method as string} with no handler!`, message);
          await handler(message);
        });

    listenError
      ? listenError()
      : listen(async (message) => {
          if (message.type != "ipc::error") return;
          this.internalHandleError(message.error);
        });
  }

  public async call<TMethod extends keyof TMethods>(
    method: TMethod,
    ...params: ExtractIpcMethodArgs<TMethods, TMethod>
  ): Promise<ExtractIpcMethodResult<TMethods, TMethod>> {
    const id = randomUUID();
    const request: IpcMethodRequest<TMethods, TMethod> = {
      id: id,
      type: "ipc::request",
      method: method,
      params: params
    };

    const result = new Promise<ExtractIpcMethodResult<TMethods, TMethod>>((res, rej) => {
      const timeout = setTimeout(
        () => rej(new ExtendedError("timeout", `handler timeout ${method as string}`)),
        throwTimeout
      );

      this.handlers.set(`${method as string}_${id}`, (message) => {
        this.handlers.delete(`${method as string}_${id}`);

        clearTimeout(timeout);

        if (message.error) return rej(message.error);
        res(message.result);
      });
    });

    await this.request(request);

    return result;
  }

  public onError(handler: (e: IpcError) => void) {
    this.errorHandler = handler;
  }

  protected internalHandleError(error: IpcError) {
    if (this.errorHandler) {
      return this.errorHandler(error);
    }
    throw new ExtendedError(error.message, error.description, error.stack);
  }

  public abstract addEventListener<TEvent extends keyof TEvents & string>(
    event: TEvent,
    callback: (...data: TEvents[TEvent]) => Awaitable<unknown>
  ): void;
}

export * from "./types";
