import { esbuildPluginFilePathExtensions } from "esbuild-plugin-file-path-extensions"
import { replaceTscAliasPaths } from "tsc-alias"
import { defineConfig } from "tsup"

// // eslint-disable-next-line import/no-default-export
// export default defineConfig({
// 	entry: ["src/**/*"],
// 	clean: true,
// 	dts: true,
// 	bundle: true,
// 	format: ["esm"],
// 	target: ["node18", "chrome122"],
// 	outDir: "build",

// 	esbuildPlugins: [esbuildPluginFilePathExtensions()],

// 	async onSuccess() {
// 		await replaceTscAliasPaths({
// 			configFile: "tsconfig.json",
// 			watch: false,
// 			outDir: "build",
// 			declarationDir: "build",
// 		})
// 	},
// })

// eslint-disable-next-line import/no-default-export
export default defineConfig({
	splitting: true,
	clean: true,
	dts: true,
	format: ["cjs", "esm"],
	bundle: true,
	skipNodeModulesBundle: true,
	entry: ["src/**/*.ts"],
	target: ["node18", "chrome122"],
	outDir: "build",
})
