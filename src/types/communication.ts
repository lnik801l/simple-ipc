import type { Worker } from "worker_threads";
import { IpcMethods, IpcEvents, ExtractIpcMethodArgs, ExtractIpcMethodResult, Awaitable } from ".";

export type IpcChannelClient<TMethods extends IpcMethods, TEvents extends IpcEvents> = {
  call<T extends keyof TMethods>(
    method: T,
    ...args: ExtractIpcMethodArgs<TMethods, T>
  ): Promise<ExtractIpcMethodResult<TMethods, T>>;
  listen<T extends keyof TEvents>(event: T, callback: (...data: TEvents[T]) => Awaitable<unknown>): void;
};

export type IpcChannelServer<TMethods extends IpcMethods, TEvents extends IpcEvents> = {
  reply<TEvent extends keyof TMethods>(
    worker: Worker,
    event: TEvent,
    callback: (...data: ExtractIpcMethodArgs<TMethods, TEvent>) => Awaitable<ExtractIpcMethodResult<TMethods, TEvent>>
  ): void;
  emit<TEvent extends keyof TEvents>(event: TEvent, ...data: TEvents[TEvent]): void;
};

export type IpcChannelEventsService<TEvents extends IpcEvents> = {
  addEventListener<TEvent extends keyof TEvents>(event: TEvent, callback: (...data: TEvents[TEvent]) => unknown): void;
};

export type IpcChannelMethodsService<TMethods extends IpcMethods> = {
  [TMethod in keyof TMethods]: (
    ...args: ExtractIpcMethodArgs<TMethods, TMethod>
  ) => Awaitable<ExtractIpcMethodResult<TMethods, TMethod>>;
};

export type IpcChannelService<
  TMethods extends IpcMethods,
  TEvents extends IpcEvents
> = IpcChannelMethodsService<TMethods> & IpcChannelEventsService<TEvents>;
