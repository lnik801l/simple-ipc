import {
  AbstractIpcClient,
  AbstractIpcServer,
  ExtractIpcMethodArgs,
  ExtractIpcMethodResult,
  IpcEvents,
  IpcError,
  IpcMethodResponse,
  IpcMethods,
  Awaitable
} from "..";
import type { BrowserWindow, ipcMain, ipcRenderer } from "electron";
import { ExtendedError } from "../errors.js";

const eventPrefix = "ipc::event::";

export class IpcMainServer<TMethods extends IpcMethods, TEvents extends IpcEvents> extends AbstractIpcServer<
  TMethods,
  TEvents
> {
  public constructor(private window: BrowserWindow) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    if (require("worker_threads").isMainThread != true) {
      throw new Error("IpcMainServer can be used only inside main electron thread");
    }
    super(
      () => {},
      () => {}
    );
  }

  public override emit<TEvent extends keyof TEvents>(event: TEvent, ...data: TEvents[TEvent]) {
    console.log("MAIN -> RENDERER EVENT", event, ...data);
    this.window.webContents.send(eventPrefix + (event as string), ...JSON.parse(JSON.stringify(data)));
  }

  public override createHandler<TMethod extends keyof TMethods>(
    method: TMethod,
    callback: (...data: ExtractIpcMethodArgs<TMethods, TMethod>) => Awaitable<ExtractIpcMethodResult<TMethods, TMethod>>
  ): void {
    ipcMain.handle(method as string, async (_, ...args) => {
      let result: ExtractIpcMethodResult<TMethods, TMethod> | undefined = undefined;
      let error: IpcError | undefined = undefined;

      try {
        result = await callback(...args);
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
        id: "-",
        type: "ipc::response",
        method: method,
        error,
        result
      };

      return response;
    });
  }

  public createSyncHandler<TMethod extends keyof TMethods>(
    method: TMethod,
    callback: (...data: ExtractIpcMethodArgs<TMethods, TMethod>) => Awaitable<ExtractIpcMethodResult<TMethods, TMethod>>
  ): void {
    ipcMain.on(method as string, async (e, ...args) => {
      let result: ExtractIpcMethodResult<TMethods, TMethod> | undefined = undefined;
      let error: IpcError | undefined = undefined;

      try {
        result = await callback(...args);
        // serialization lifehack for proxies etc.
        if (result) result = JSON.parse(JSON.stringify(result));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        error = {
          message: err?.message ?? "no message",
          stack: err?.stack ?? "???",
          description: err?.description
        };
      }

      const response: IpcMethodResponse<TMethods, TMethod> = {
        id: "-",
        type: "ipc::response",
        method: method,
        error,
        result
      };

      e.returnValue = response;
    });
  }
}

export class IpcRendererClient<TMethods extends IpcMethods, TEvents extends IpcEvents> extends AbstractIpcClient<
  TMethods,
  TEvents
> {
  public constructor() {
    super(
      () => {},
      () => {},
      () => {},
      () =>
        ipcRenderer.on(eventPrefix + "error", async (_, error) => {
          if (this.errorHandler) {
            return this.errorHandler(error);
          }
          throw new ExtendedError(error.message, error.description, error.stack);
        })
    );
  }

  public override async call<TMethod extends keyof TMethods>(
    method: TMethod,
    ...data: ExtractIpcMethodArgs<TMethods, TMethod>
  ): Promise<ExtractIpcMethodResult<TMethods, TMethod>> {
    console.log("CALL", method, data);
    const result: IpcMethodResponse<TMethods, TMethod> = await ipcRenderer.invoke(method as string, ...data);
    console.log("CALL RESULT", result);

    return result.error ? this.internalHandleError(result.error) : result.result;
  }

  public callSync<TMethod extends keyof TMethods>(
    method: TMethod,
    ...data: ExtractIpcMethodArgs<TMethods, TMethod>
  ): ExtractIpcMethodResult<TMethods, TMethod> {
    console.log("CALL SYNC", method, data);
    const result: IpcMethodResponse<TMethods, TMethod> = ipcRenderer.sendSync(method as string, ...data);
    console.log("CALL SYNC RESULT", result);

    return result.error ? this.internalHandleError(result.error) : result.result;
  }

  public addEventListener<TEvent extends keyof TEvents & string>(
    event: TEvent,
    callback: (...data: TEvents[TEvent]) => unknown
  ): void {
    ipcRenderer.on(eventPrefix + event, async (_, ...data) => {
      console.log(event, ...data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await callback(...(data as any));
    });
  }
}
