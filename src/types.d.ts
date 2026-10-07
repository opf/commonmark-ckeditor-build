// Ambient declarations: globals provided by OpenProject core at runtime
// and non-code assets resolved by webpack loaders.
//
// This file must stay a script (no top-level import/export) so that its
// declarations are global.

interface Window {
	I18n: {
		t(key: string, options?: Record<string, unknown>): string;
	};
	OpenProject: {
		urlRoot: string;
	};
}

declare module '*.svg' {
	const content: string;
	export default content;
}
