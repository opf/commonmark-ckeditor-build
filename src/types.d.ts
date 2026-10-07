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
	// Set by this build for core to pick up; see op-ckeditor.ts.
	OPConstrainedEditor: typeof import('./op-ckeditor').ConstrainedEditor;
	OPClassicEditor: typeof import('./op-ckeditor').FullEditor;
	OPEditorWatchdog: typeof import('@ckeditor/ckeditor5-watchdog').EditorWatchdog;
}

// Fired by core when a dialog it opened for the editor closes.
interface DocumentEventMap {
	'dialog:close': CustomEvent<{
		additional?: {
			action?: string;
			providerId?: string;
			pageIdentifier?: string;
		};
	}>;
}

// Core also exposes I18n as a bare global.
declare var I18n: Window['I18n'];

declare module '*.svg' {
	const content: string;
	export default content;
}

declare module 'turndown-plugin-gfm' {
	import type TurndownService from 'turndown';

	export const gfm: TurndownService.Plugin;
	export const highlightedCodeBlock: TurndownService.Plugin;
	export const strikethrough: TurndownService.Plugin;
	export const tables: TurndownService.Plugin;
	export const taskListItems: TurndownService.Plugin;
}

declare module 'markdown-it-task-lists' {
	import type { PluginWithOptions } from 'markdown-it';

	const taskLists: PluginWithOptions<{
		enabled?: boolean;
		label?: boolean;
		labelAfter?: boolean;
	}>;
	export default taskLists;
}

declare module '@rails/request.js' {
	export interface RequestOptions {
		body?: unknown;
		contentType?: string;
		headers?: Record<string, string>;
		query?: Record<string, string>;
		responseKind?: string;
	}

	export interface FetchResponse {
		readonly ok: boolean;
		readonly statusCode: number;
		readonly json: Promise<unknown>;
		readonly text: Promise<string>;
	}

	export function get(url: string, options?: RequestOptions): Promise<FetchResponse>;
}
