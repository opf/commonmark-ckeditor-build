import globals from "globals";
import eslint from '@eslint/js';
import jestPlugin from 'eslint-plugin-jest';
import tseslint from 'typescript-eslint';

const tsFiles = ["src/**/*.ts", "tests/**/*.ts"];

const tsRules = {
	// TypeScript reports undefined names itself.
	"no-undef": "off",
	"no-cond-assign": "off",
	// TODO(OP-18993): re-enable once the conversion has merged. It changes
	// types only, and these would demand edits to runtime code that the
	// JavaScript rules never asked for.
	"prefer-const": "off",
	"no-var": "off",
	"prefer-rest-params": "off",
	"prefer-spread": "off",
	"@typescript-eslint/no-this-alias": "off",
	"@typescript-eslint/no-unused-expressions": "off",
	"no-unused-vars": "off",
	"@typescript-eslint/no-unused-vars": [
		"error",
		{
			"argsIgnorePattern": "^_",
			"caughtErrorsIgnorePattern": "^_",
			"varsIgnorePattern": "^_"
		}
	],
	"@typescript-eslint/no-explicit-any": "error",
	"@typescript-eslint/ban-ts-comment": [
		"error",
		{
			"ts-expect-error": "allow-with-description",
			"ts-ignore": true,
			"ts-nocheck": true,
			"minimumDescriptionLength": 10
		}
	]
};

export default [
	eslint.configs.recommended,
	{
		ignores: ["tmp/", "coverage/", "node_modules/"],
	},
	{
		files: ["src/**/*.js"],
		languageOptions: {
			globals: {
				...globals.browser,
				"jQuery": true,
				"I18n": true,
				"_": true
			}
		},
		rules: {
			"no-cond-assign": "off",
			"no-unused-vars": [
				"error",
				{
					// "args": "all",
					"argsIgnorePattern": "^_",
					// "caughtErrors": "all",
					"caughtErrorsIgnorePattern": "^_",
					// "destructuredArrayIgnorePattern": "^_",
					"varsIgnorePattern": "^_",
					// "ignoreRestSiblings": true
				}
			],
			"no-undef": "error"
		}
	},
	{
		files: ["jest.setup.js", "tests/**/*.js"],
		plugins: {
			jest: jestPlugin
		},
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...globals.jest
			}
		},
		rules: {
			"no-unused-vars": "error",
			"no-undef": "error"
		}
	},
	{
		files: ["jest.config.js", 'babel.config.js', 'webpack.config.js'],
		languageOptions: {
			globals: {
				...globals.node
			}
		},
		rules: {
			"no-unused-vars": "error",
			"no-undef": "error"
		}
	},
	{
		files: ["bin/**/*.mjs"],
		languageOptions: {
			globals: {
				...globals.node
			}
		},
		rules: {
			"no-unused-vars": "error",
			"no-undef": "error"
		}
	},
	...tseslint.configs.recommended.map(config => ({ ...config, files: tsFiles })),
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			globals: {
				...globals.browser
			}
		},
		rules: tsRules
	},
	{
		files: ["tests/**/*.ts"],
		plugins: {
			jest: jestPlugin
		},
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
				...globals.jest
			}
		},
		rules: tsRules
	},
];
