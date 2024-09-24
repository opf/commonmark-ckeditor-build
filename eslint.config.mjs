import globals from "globals";
import eslint from '@eslint/js';
import jestPlugin from 'eslint-plugin-jest';

export default [
	eslint.configs.recommended,
	{
		files: ["src/**/*.js"],
		languageOptions: {
			globals: {
				...globals.browser,
				"jQuery": true,
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
];
