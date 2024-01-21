import { defineConfig } from "tsup"

// eslint-disable-next-line import/no-default-export
export default defineConfig({
	clean: true,
	dts: true,
	splitting: false,
	bundle: true,
	skipNodeModulesBundle: true,
	format: ["cjs", "esm"],
	entry: [
		"src/index.ts",
		// adapters
		"src/adapters/index.ts",
		"src/adapters/worker-threads.ts",
		"src/adapters/electron.ts",
	],
	target: ["node18", "chrome122"],
	outDir: "build",
})
