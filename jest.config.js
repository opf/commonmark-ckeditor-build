/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

module.exports = {
	// Automatically clear mock calls, instances, contexts and results before every test
	clearMocks: true,
	// Indicates whether the coverage information should be collected while executing the test
	collectCoverage: true,
	// The directory where Jest should output its coverage files
	coverageDirectory: "coverage",
	// A list of paths to directories that Jest should use to search for files in
	roots: [
		"tests",
		"src"
	],
	// A map from regular expressions to paths to transformers
	transform: {
		'^.+\\.js$': 'babel-jest',
	},
	// A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
	moduleNameMapper: {
		"\\.(css|less|scss|sass)$": "identity-obj-proxy"
	},
	// The test environment that will be used for testing
	testEnvironment: "jsdom",
	// The paths to modules that run some code to configure or set up the testing environment before each test
	setupFiles: ['<rootDir>/jest.setup.js'],
	// An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
	transformIgnorePatterns: []
};
