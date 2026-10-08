module.exports = {
	presets: [
		[
			"@babel/preset-env",
			{
				targets: {
					node: "current",
				},
			},
		],
		[
			"@babel/preset-typescript",
			{
				// Match tsc: keep imports unless written as `import type`,
				// and let `declare` fields emit nothing.
				onlyRemoveTypeImports: true,
				allowDeclareFields: true,
			},
		],
	],
	plugins: ["@babel/plugin-transform-modules-commonjs"]
}
