import { IpcMethodRequest, IpcMethodResponse } from "./messages";

export type Awaitable<T> = T | Promise<T>;

export type IpcMethods = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: IpcChannelData<any, any[]>;
};

export type IpcEvents = {
  [key: string]: unknown[];
};

export type IpcChannelData<TResult = void, TArgs extends unknown[] = []> = {
  result: TResult;
  args: TArgs;
};

export type ExtractIpcMethodArgs<
  TMethods extends IpcMethods,
  TMethod extends keyof TMethods
> = TMethods[TMethod]["args"];

export type ExtractIpcMethodResult<
  TMethods extends IpcMethods,
  TMethod extends keyof TMethods
> = TMethods[TMethod]["result"];

export type IpcServerCallback = (message: IpcMethodRequest<any, keyof any>) => Awaitable<void>;
export type IpcClientCallback = (message: IpcMethodResponse<any, keyof any>) => Awaitable<void>;

export * from "./communication";
export * from "./messages";
export * from "./primitives";
