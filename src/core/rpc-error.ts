/**
 * Error thrown when an RPC call fails.
 * Provides a remote stack trace.
 */
export class RpcError extends Error {
	constructor(
		message: string,
		readonly remoteStack: string,
	) {
		super(message)
	}
}
