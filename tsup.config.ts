import { defineConfig } from "tsup"

// eslint-disable-next-line import/no-default-export
export default defineConfig({
	clean: true,
	dts: true,
	splitting: false,
	bundle: true,
	skipNodeModulesBundle: true,
	format: ["cjs", "esm"],
	entry: ["src/index.ts", "src/adapters/*.ts"],
	target: ["node18", "chrome122"],
	outDir: "build",
})
