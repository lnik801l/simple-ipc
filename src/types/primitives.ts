import { Awaitable } from "./index.js";

export type IpcMethods = {
  [key: string]: (...args: any[]) => Awaitable<unknown>;
};

export type IpcEvents = {
  [key: string]: unknown[];
};

export type IpcError = { message: string; stack: string; description?: string };
