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
	return defineAdapter<TMessage>({
		publish: (message) => {
			window.webContents.send(electronIpcChannel, message)
		},
		subscribe: (callback) => {
			ipcMain.handle(
				electronIpcChannel,
				(_: IpcMainInvokeEvent, message: TMessage) => callback(message),
			)
		},
		unsubscribe: () => {
			throw new Error("cannot unsubscribe in main thread")
		},
	})
}

/**
 * Create an adapter that allows to communicate with main process from renderer process.
 */
export function createMainThreadAdapter<TMessage>() {
	const subscribers = new Map<
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
			subscribers.set(callback, wrappedCallback)
		},
		unsubscribe: (callback) => {
			const wrappedCallback = subscribers.get(callback)
			if (!wrappedCallback) {
				return
			}

			ipcMain.off(electronIpcChannel, wrappedCallback)
		},
	})
}
