import {
	type BrowserWindow,
	ipcMain,
	type IpcMainInvokeEvent,
	ipcRenderer,
	type IpcRendererEvent,
} from "electron"
import { defineAdapter } from "@/core"

const electronIpcChannel = "ipc::message"

/**
 * Create an adapter that allows to communicate with renderer process from main process.
 */
export function createRendererThreadAdapter<TMessage>(window: BrowserWindow) {
	const wrappedSubscribers = new Map<
		(message: TMessage) => void,
		(event: IpcMainInvokeEvent, message: TMessage) => void
	>()

	return defineAdapter<TMessage>({
		publish: (message) => {
			window.webContents.send(electronIpcChannel, message)
		},
		subscribe: (callback) => {
			const wrappedCallback = (_: IpcMainInvokeEvent, message: TMessage) =>
				callback(message)

			ipcMain.on(electronIpcChannel, wrappedCallback)

			wrappedSubscribers.set(callback, wrappedCallback)
		},
		unsubscribe: (callback) => {
			const wrappedCallback = wrappedSubscribers.get(callback)

			if (!wrappedCallback) {
				return
			}

			ipcMain.off(electronIpcChannel, wrappedCallback)
		},
	})
}

/**
 * Create an adapter that allows to communicate with main process from renderer process.
 */
export function createMainThreadAdapter<TMessage>() {
	const wrappedSubscribers = new Map<
		(message: TMessage) => void,
		(event: IpcRendererEvent, message: TMessage) => void
	>()

	return defineAdapter<TMessage>({
		publish: (message) => {
			ipcRenderer.send(electronIpcChannel, message)
		},
		subscribe: (callback) => {
			const wrappedCallback = (_: IpcRendererEvent, message: TMessage) =>
				callback(message)

			ipcRenderer.on(electronIpcChannel, wrappedCallback)

			wrappedSubscribers.set(callback, wrappedCallback)
		},
		unsubscribe: (callback) => {
			const wrappedCallback = wrappedSubscribers.get(callback)

			if (!wrappedCallback) {
				return
			}

			ipcRenderer.off(electronIpcChannel, wrappedCallback)
		},
	})
}
