import type { MessagePort, Worker } from "node:worker_threads"
import { parentPort } from "node:worker_threads"
import { defineAdapter } from "@/core/adapter"

function ensureParentPortOpen(
	parentPort: MessagePort | null,
): asserts parentPort is NonNullable<typeof parentPort> {
	if (parentPort) {
		return
	}

	throw new Error("parentPort is not available")
}

/**
 * Create an adapter that allows to communicate with child workers.
 */
export function createWorkerThreadAdapter<TMessage>(worker: Worker) {
	return defineAdapter<TMessage>({
		publish: (message) => {
			worker.postMessage(message)
		},
		subscribe: (callback) => {
			worker.on("message", callback)
		},
		unsubscribe: (callback) => {
			worker.off("message", callback)
		},
	})
}

/**
 * Create an adapter that allows to communicate with the parent thread.
 */
export function createParentThreadAdapter<TMessage>() {
	return defineAdapter<TMessage>({
		publish: (message) => {
			ensureParentPortOpen(parentPort)

			parentPort.postMessage(message)
		},
		subscribe: (callback) => {
			ensureParentPortOpen(parentPort)
			parentPort.on("message", callback)
		},
		unsubscribe: (callback) => {
			ensureParentPortOpen(parentPort)

			parentPort.off("message", callback)
		},
	})
}
