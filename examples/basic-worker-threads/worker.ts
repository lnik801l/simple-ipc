import { createServer, defineEvent, defineMethod } from "z-ipc"
import { createParentThreadAdapter } from "z-ipc/worker-threads"

// Create a server and implement worker API
// Use the parent thread adapter to communicate with the main thread
const server = createServer(createParentThreadAdapter(), {
	// Simple RPC method
	add: defineMethod((a: number, b: number) => a + b),

	// Timer with a tick event and an end event
	startTimer: defineMethod((seconds: number) => {
		let remaining = seconds

		const interval = setInterval(() => {
			server.emit("timerTick", remaining)

			if (remaining === 0) {
				clearInterval(interval)

				server.emit("timerEnd")
			} else {
				remaining--
			}
		}, 1000)
	}),

	// Event with a numeric payload
	timerTick: defineEvent<number>(),
	// Event without a payload
	timerEnd: defineEvent(),
})

// Expose the server protocol type
export type Protocol = typeof server.protocol
