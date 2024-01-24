import {
	BrowserWindow,
	type IpcMainInvokeEvent,
	type IpcRendererEvent,
} from "electron"
import { ipcMain, ipcRenderer } from "electron"
import { defineAdapter } from "@/core"

const electronIpcChannel = "ipc::message"
const electronIpcWindowChannel = [electronIpcChannel, "window-id"].join("::")

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (ipcMain) {
	ipcMain.on(electronIpcWindowChannel, (event) => {
		event.returnValue = BrowserWindow.fromWebContents(event.sender)!.id
	})
}

/**
 * Create an adapter that allows to communicate with renderer process from main process.
 */
export function createRendererThreadAdapter<TMessage>(window: BrowserWindow) {
	const wrappedSubscribers = new Map<
		(message: TMessage) => void,
		(event: IpcMainInvokeEvent, message: TMessage) => void
	>()
	const channel = [electronIpcChannel, window.id].join("::")

	return defineAdapter<TMessage>({
		publish: (message) => {
			window.webContents.send(channel, message)
		},
		subscribe: (callback) => {
			const wrappedCallback = (_: IpcMainInvokeEvent, message: TMessage) =>
				callback(message)

			ipcMain.on(channel, wrappedCallback)

			wrappedSubscribers.set(callback, wrappedCallback)
		},
		unsubscribe: (callback) => {
			const wrappedCallback = wrappedSubscribers.get(callback)

			if (!wrappedCallback) {
				return
			}

			ipcMain.off(channel, wrappedCallback)
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

	const channel = [
		electronIpcChannel,
		ipcRenderer.sendSync(electronIpcWindowChannel),
	].join("::")

	return defineAdapter<TMessage>({
		publish: (message) => {
			ipcRenderer.send(channel, message)
		},
		subscribe: (callback) => {
			const wrappedCallback = (_: IpcRendererEvent, message: TMessage) =>
				callback(message)

			ipcRenderer.on(channel, wrappedCallback)

			wrappedSubscribers.set(callback, wrappedCallback)
		},
		unsubscribe: (callback) => {
			const wrappedCallback = wrappedSubscribers.get(callback)

			if (!wrappedCallback) {
				return
			}

			ipcRenderer.off(channel, wrappedCallback)
		},
	})
}
