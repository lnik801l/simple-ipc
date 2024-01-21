/**
 * A method is an IPC primitive for RPC style communication.
 */
export type Method<TArgs extends unknown[] = never, TResult = unknown> = {
	kind: "method"

	handler: (...args: TArgs) => TResult
}

export function defineMethod<
	TArgs extends unknown[] = never,
	TResult = unknown,
>(handler: (...args: TArgs) => TResult): Method<TArgs, TResult> {
	return {
		kind: "method",
		handler,
	}
}

/**
 * An event is an IPC primitive that allows to send a message.
 */
export type Event<TPayload = never> = {
	kind: "event"

	/**
	 * Dummy handler to allow to infer the payload type.
	 */
	handler?: (payload: TPayload) => void
}

export function defineEvent<TPayload = void>(): Event<TPayload> {
	return {
		kind: "event",
	}
}

/**
 * A protocol is a collection of methods and events.
 * It is used to define the contract between a client and a server.
 */
export type Protocol = Record<string, Method | Event>

export namespace Protocol {
	export type InferMethods<TProtocol extends Protocol> = {
		[K in keyof TProtocol as TProtocol[K] extends Method
			? K
			: never]: TProtocol[K]
	}

	export type InferEvents<TProtocol extends Protocol> = {
		[K in keyof TProtocol as TProtocol[K] extends Event
			? K
			: never]: TProtocol[K]
	}
}

export type DefineProtocol<TProtocol extends Protocol> = TProtocol

export type DefineMethod<
	TSignature extends (...args: never) => unknown = () => void,
> = Method<Parameters<TSignature>, ReturnType<TSignature>>

export type DefineEvent<TPayload = void> = Event<TPayload>
