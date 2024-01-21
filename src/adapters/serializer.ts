import { type Adapter, defineAdapter } from "@/core/adapter"

/**
 * A serializer is a pair of functions that allows to serialize and deserialize messages.
 */
export type Serializer = {
	stringify: (message: unknown) => string
	parse: (message: string) => unknown
}

/**
 * Wrap an adapter with a serializer to allow to send and receive messages of any type.
 */
export function createSerializedAdapter<TMessage>(
	adapter: Adapter<string>,
	serializer: Serializer,
) {
	const wrappedSubscribers = new Map<
		(message: TMessage) => void,
		(message: string) => void
	>()

	return defineAdapter<TMessage>({
		publish: (message) => {
			adapter.publish(serializer.stringify(message))
		},
		subscribe: (callback) => {
			const wrappedCallback = (message: string) => {
				callback(serializer.parse(message) as TMessage)
			}

			adapter.subscribe(wrappedCallback)

			wrappedSubscribers.set(callback, wrappedCallback)
		},
		unsubscribe: (callback) => {
			const wrappedCallback = wrappedSubscribers.get(callback)

			if (!wrappedCallback) {
				return
			}

			adapter.unsubscribe(wrappedCallback)

			wrappedSubscribers.delete(callback)
		},
	})
}
