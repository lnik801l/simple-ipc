# z-ipc 🍺🦖

Z-IPC is an easy-to-use, extensible and fully type-safe IPC solution for JavaScript environments.

[[npm](https://www.npmjs.com/package/z-ipc)]

## Key features

* **Easy-to-use**: Z-IPC supports RPC and Pub/Sub communication and provides a simple API for both.
* **Extensible**: Communication APIs are built on top of a generic transport layer, which can be extended to support any communication protocol.
* **Battery-included**: Z-IPC comes with a set of built-in transports for common use cases, such as worker threads and electron.
* **Type-safe**: Clients and servers strictly follow typed communication protocols, which can be inferred from the implementation or defined explicitly.
* **Lightweight**: The core library is small and uses minimal dependencies. Transport adapters are split into separate modules and can be used on demand.

## Examples

* [Basic Worker Thread Communication Example](./examples/basic-worker-threads)
