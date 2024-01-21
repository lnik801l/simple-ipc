import type { UnionToIntersection, Values } from "@/utils"
import type { Adapter } from "./adapter"
import type { Message } from "./message"
import type { Event, Method, Protocol } from "./protocol"
import { RpcError } from "./rpc-error"

type InferPayloadArgument<T> = [T] extends [void] ? [] : [payload: T]

type InferCallSignature<TProtocol extends Protocol> = UnionToIntersection<
	Values<{
		[K in keyof TProtocol as TProtocol[K] extends Method ? K : never]: (
			method: K,
			...args: Parameters<NonNullable<TProtocol[K]["handler"]>>
		) => Promise<ReturnType<NonNullable<TProtocol[K]["handler"]>>>
	}>
>

type InferSubscribeSignature<TProtocol extends Protocol> = UnionToIntersection<
	Values<{
		[K in keyof TProtocol as TProtocol[K] extends Event ? K : never]: (
			method: K,
			listener: (
				...payload: InferPayloadArgument<
					Parameters<NonNullable<TProtocol[K]["handler"]>>[0]
				>
			) => void,
		) => void
	}>
>

/**
 * A client is responsible for calling methods and subscribing to events.
 */
export type Client<TProtocol extends Protocol> = {
	/**
	 * The protocol used by the client (should match the server's protocol).
	 *
	 * This field is only used for type inference and does not exist at runtime.
	 */
	readonly protocol: TProtocol

	/**
	 * Call a remote method.
	 */
	call: InferCallSignature<TProtocol>

	/**
	 * Subscribe to an event.
	 */
	subscribe: InferSubscribeSignature<TProtocol>

	/**
	 * Unsubscribe from an event.
	 */
	unsubscribe: InferSubscribeSignature<TProtocol>
}

/**
 * Create a client with the given adapter and protocol.
 */
export function createClient<TProtocol extends Protocol>(
	adapter: Adapter<Message>,
): Client<TProtocol> {
	const eventListeners = new Map<string, Set<(payload: unknown) => void>>()

	adapter.subscribe((message) => {
		if (message.kind !== "event") return

		const listeners = eventListeners.get(message.name)

		if (!listeners) return

		for (const listener of listeners) {
			listener(message.payload)
		}
	})

	return {
		protocol: undefined!,
		call: ((method: string, ...args: unknown[]) => {
			const id = Math.random()

			return new Promise((resolve, reject) => {
				const responseListener = (response: Message) => {
					if (response.kind !== "rpc-response") return
					if (response.id !== id) return

					adapter.unsubscribe(responseListener)

					if (response.result.error) {
						reject(
							new RpcError(
								response.result.message,
								response.result.stack,
							),
						)
					} else {
						resolve(response.result.value)
					}
				}

				adapter.subscribe(responseListener)

				adapter.publish({
					kind: "rpc-request",
					id,
					method,
					args,
				})
			})
		}) as Client<TProtocol>["call"],
		subscribe: ((event: string, listener: (payload: unknown) => void) => {
			if (!eventListeners.has(event)) {
				eventListeners.set(event, new Set())
			}

			const listeners = eventListeners.get(event)!

			listeners.add(listener)
		}) as Client<TProtocol>["subscribe"],
		unsubscribe: ((event: string, listener: (payload: unknown) => void) => {
			if (!eventListeners.has(event)) {
				return
			}

			const listeners = eventListeners.get(event)!

			listeners.delete(listener)

			if (listeners.size === 0) {
				eventListeners.delete(event)
			}
		}) as Client<TProtocol>["unsubscribe"],
	}
}
