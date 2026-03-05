import globals from "globals";
import eslint from '@eslint/js';
import jestPlugin from 'eslint-plugin-jest';
import tsParser from '@typescript-eslint/parser';

export default [
	eslint.configs.recommended,
	{
		ignores: ["tmp/", "coverage/", "node_modules/", "src/**/*.d.ts"],
	},
	{
		files: ["src/**/*.ts"],
		languageOptions: {
			parser: tsParser,
			globals: {
				...globals.browser,
				"jQuery": true,
				"I18n": true,
				"_": true
			}
		},
		rules: {
			"no-cond-assign": "off",
			"no-unused-vars": "off",
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
];
