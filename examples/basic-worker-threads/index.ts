import { Worker } from "node:worker_threads"
import { createClient } from "z-ipc"
import { createWorkerThreadAdapter } from "z-ipc/worker-threads"
// Import worker server protocol
import type { Protocol } from "./worker"

const worker = new Worker("./worker.js")

// Create a client and use the worker thread adapter to communicate with the worker
// Client will be typed based on the server protocol
const client = createClient<Protocol>(createWorkerThreadAdapter(worker))

// Call an RPC method and await the result
const sum = await client.call("add", 2, 4)

console.log(sum)

// Subscribe to timer events and start the timer
client.subscribe("timerTick", (value) => {
	console.log("timer tick", value)
})

client.subscribe("timerEnd", (value) => {
	console.log("timer end")

	// Terminate the worker thread when the timer ends
	worker.terminate()
})

client.call("startTimer", 10)
