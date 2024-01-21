export namespace Message {
	export type RpcRequest = {
		kind: "rpc-request"
		id: number
		method: string
		args: unknown[]
	}

	export type RpcResponse = {
		kind: "rpc-response"
		id: number
		result:
			| { error: false; value: unknown }
			| { error: true; message: string; stack: string }
	}

	export type Event = {
		kind: "event"
		name: string
		payload: unknown
	}
}

export type Message = Message.RpcRequest | Message.RpcResponse | Message.Event

export function createOkResponse(id: number, value: unknown): Message {
	return {
		kind: "rpc-response",
		id,
		result: {
			error: false,
			value,
		},
	}
}

export function createErrorResponse(id: number, error: Error): Message {
	return {
		kind: "rpc-response",
		id,
		result: {
			error: true,
			message: error.message,
			stack: error.stack ?? "???",
		},
	}
}
