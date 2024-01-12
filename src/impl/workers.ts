import { isMainThread, parentPort, type MessagePort, type Worker } from "worker_threads";
import { AbstractIpcClient, AbstractIpcServer } from "..";
import { IpcEvents, IpcError, IpcMethods, Awaitable } from "../types";

const eventsPrefix = "ipc::events::";

export class IpcWorkerWorkerServer<
  TMethods extends IpcMethods,
  TEvents extends IpcEvents = IpcEvents
> extends AbstractIpcServer<TMethods, TEvents> {
  private port: MessagePort;

  public constructor() {
    if (isMainThread || !parentPort) {
      throw new Error("worker client can be created only inside worker_threads context!");
    }
    super(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (callback) => parentPort!.on("message", callback),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (message) => parentPort!.postMessage(message)
    );
    this.port = parentPort;

    process.on("uncaughtException", (error: IpcError) => {
      this.sendError({
        message: error?.message ?? "no message",
        stack: error?.stack ?? "???",
        description: error?.description
      });
    });
  }

  public emit<TEvent extends keyof TEvents>(event: TEvent, ...data: TEvents[TEvent]): void {
    this.port.postMessage({
      event: eventsPrefix + (event as string),
      data: JSON.parse(JSON.stringify(data))
    });
  }
}

export class IpcWorkerWorkerClient<
  TMethods extends IpcMethods,
  TEvents extends IpcEvents = IpcEvents
> extends AbstractIpcClient<TMethods, TEvents> {
  private port: MessagePort;

  public constructor() {
    if (isMainThread || !parentPort) {
      throw new Error("worker client can be created only inside worker_threads context!");
    }
    super(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (request) => parentPort!.postMessage(request),
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (callback) => parentPort!.on("message", callback)
    );

    this.port = parentPort;
  }

  public addEventListener<TEvent extends keyof TEvents & string>(
    event: TEvent,
    callback: (...data: TEvents[TEvent]) => unknown
  ): void {
    this.port.addListener("message", async (v) => {
      if (v.event != eventsPrefix + event) return;
      await callback(...v.data);
    });
  }
}

export class IpcWorkerMainServer<
  TMethods extends IpcMethods,
  TEvents extends IpcEvents = IpcEvents
> extends AbstractIpcServer<TMethods, TEvents> {
  private worker: Worker;

  public constructor(worker: Worker) {
    if (!isMainThread) {
      throw new Error("worker server can be used only inside main process!");
    }
    super(
      (callback) => worker.on("message", callback),
      (message) => worker.postMessage(message)
    );
    this.worker = worker;
  }

  public emit<TEvent extends keyof TEvents>(event: TEvent, ...data: TEvents[TEvent]): void {
    this.worker.emit("message", {
      event: eventsPrefix + (event as string),
      data
    });
  }
}

export class IpcWorkerMainClient<
  TMethods extends IpcMethods,
  TEvents extends IpcEvents = IpcEvents
> extends AbstractIpcClient<TMethods, TEvents> {
  public constructor(private worker: Worker) {
    if (!isMainThread) {
      throw new Error("worker server can be used only inside main process!");
    }
    super(
      (request) => worker.postMessage(request),
      (callback) => worker.on("message", callback)
    );
  }

  public addEventListener<TEvent extends keyof TEvents & string>(
    event: TEvent,
    callback: (...data: TEvents[TEvent]) => Awaitable<unknown>
  ): void {
    this.worker.on("message", async (v) => {
      if (v.event != eventsPrefix + event) return;
      await callback(...v.data);
    });
  }
}
