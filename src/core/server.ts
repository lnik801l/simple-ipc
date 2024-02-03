import type { UnionToIntersection, Values } from "@/utils"
import type { Adapter } from "./adapter"
import { createErrorResponse, createOkResponse, type Message } from "./message"
import type { Event, Protocol } from "./protocol"

type InferPayloadArgument<T> = [T] extends [void] ? [] : [payload: T]

type InferEmitSignature<TProtocol extends Protocol> = UnionToIntersection<
	Values<{
		[K in keyof TProtocol as TProtocol[K] extends Event ? K : never]: (
			method: K,
			...payload: InferPayloadArgument<
				Parameters<NonNullable<TProtocol[K]["handler"]>>[0]
			>
		) => void
	}>
>

/**
 * A server is responsible for handling method calls and emitting events.
 */
export type Server<TProtocol extends Protocol> = {
	/**
	 * The protocol used by the server.
	 */
	readonly protocol: TProtocol

	/**
	 * Emit an event.
	 */
	emit: InferEmitSignature<TProtocol>
}

/**
 * Create a server with the given adapter and protocol.
 */
export function createServer<TProtocol extends Protocol>(
	adapter: Adapter<Message>,
	protocol: TProtocol,
): Server<TProtocol> {
	adapter.subscribe(async (message) => {
		if (message.kind !== "rpc-request") {
			return
		}

		const method = protocol[message.method]

		if (!method || method.kind !== "method") {
			adapter.publish(
				createErrorResponse(message.id, new TypeError("Unknown method")),
			)
			return
		}

		try {
			const result = await method.handler(...(message.args as never))

			adapter.publish(createOkResponse(message.id, result))
		} catch (error) {
			console.error(error)
			if (error instanceof Error) {
				adapter.publish(createErrorResponse(message.id, error))
			} else {
				adapter.publish(
					createErrorResponse(message.id, new Error("Unknown error")),
				)
			}
		}
	})

	return {
		protocol,
		emit: ((event: string, payload: unknown) => {
			adapter.publish({
				kind: "event",
				name: event,
				payload,
			})
		}) as Server<TProtocol>["emit"],
	}
}
