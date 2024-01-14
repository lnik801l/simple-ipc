import type { Adapter } from "@/core"

/**
 * Create an adapter that proxies all messages from one adapter to another.
 */
export function createProxyAdapter<TMessage>(
	source: Adapter<TMessage>,
	destination: Adapter<TMessage>,
) {
	source.subscribe((message) => destination.publish(message))

	return source
}
