/**
 * An adapter is an IPC primitive that allows to send and receive messages.
 */
export type Adapter<TMessage = unknown> = {
	/**
	 * Publish a message.
	 */
	publish: (message: TMessage) => void

	/**
	 * Subscribe to messages.
	 */
	subscribe: (callback: (message: TMessage) => void) => void

	/**
	 * Unsubscribe from messages.
	 */
	unsubscribe: (callback: (message: TMessage) => void) => void
}

/**
 * A helper function that allows to define adapter in a more convenient way.
 */
export function defineAdapter<TMessage>(adapter: Adapter<TMessage>) {
	return adapter
}
