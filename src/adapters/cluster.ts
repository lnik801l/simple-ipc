import { type Adapter, defineAdapter } from "@/core/adapter"

/**
 * Join multiple adapters into one.
 */
export function createClusterAdapter<TMessage>(
	adapter: Adapter<TMessage>,
	...adapters: Adapter<TMessage>[]
) {
	const adapterPool = [adapter, ...adapters]

	return defineAdapter<TMessage>({
		publish: (message) => {
			for (const adapter of adapterPool) {
				adapter.publish(message)
			}
		},
		subscribe: (callback) => {
			for (const adapter of adapterPool) {
				adapter.subscribe(callback)
			}
		},
		unsubscribe: (callback) => {
			for (const adapter of adapterPool) {
				adapter.unsubscribe(callback)
			}
		},
	})
}
