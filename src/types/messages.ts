/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtractIpcMethodResult, IpcError, IpcMethods } from ".";

export type IpcMethodRequest<TMethods extends IpcMethods, TMethod extends keyof TMethods> = {
  type: "ipc::request";
  id: string;
  method: TMethod;
  params: ExtractIpcMethodResult<TMethods, TMethod>;
};

export type IpcResponseError = {
  type: "ipc::error";
  error: IpcError;
};

export type IpcMethodResponse<TMethods extends IpcMethods, TMethod extends keyof TMethods> =
  | IpcMethodResponseOk<TMethods, TMethod>
  | IpcMessageResponseError<TMethods, TMethod>;

type IpcMessageReponseBase<TMethods extends IpcMethods, TMethod extends keyof TMethods> = {
  type: "ipc::response";
  id: string;
  method: TMethod;
};

export type IpcMethodResponseOk<TMethods extends IpcMethods, TMethod extends keyof TMethods> = {
  error: undefined;
  result: ExtractIpcMethodResult<TMethods, TMethod>;
} & IpcMessageReponseBase<TMethods, TMethod>;

export type IpcMessageResponseError<TMethods extends IpcMethods, TMethod extends keyof TMethods> = {
  error: IpcError;
  result: undefined;
} & IpcMessageReponseBase<TMethods, TMethod>;

export type IpcMessagesRequests = IpcMethodRequest<any, any>;
export type IpcMessagesResponses = IpcMethodResponse<any, any> | IpcResponseError;
