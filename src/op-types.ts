// Shapes of the objects OpenProject core hands to the editor.
//
// Core passes them through the editor configuration (see
// `ICKEditorContext` and the editor setup service in core). Only members
// that this repository reads are declared.

import type { Editor } from '@ckeditor/ckeditor5-core';

/** A HAL resource (work package, comment, ...) the editor belongs to. */
export interface OpResource {
	_type: string;
	id?: string | number | null;
	canAddAttachments?: boolean;
	$embedded?: {
		workPackage?: OpResource;
	};
}

/** The editing context: which resource and field, and what is enabled. */
export interface OpContext {
	type?: string;
	resource?: OpResource;
	field?: string;
	removePlugins?: string[];
	// Names of enabled macro plugins, or false to disable all of them.
	macros?: string[] | boolean;
	options?: {
		rtl?: boolean;
	};
	previewContext?: string;
	disabledMentions?: string[];
	storageKey?: string;
}

export interface OpPathHelper {
	api: {
		v3: {
			principals(resource: OpResource, query: string): string;
		};
	};
	wikiPageLinkMacro(providerId: string, pageIdentifier: string, frameId: string): string;
	openNewWikiPageDialog(): string;
	openExistingWikiPageDialog(): string;
}

/** Angular services of core that plugins call into. */
export interface OpServices {
	pathHelperService: OpPathHelper;
	apiV3Service: Record<string, { segment: string }>;
	i18n: {
		t(key: string, options?: Record<string, unknown>): string;
	};
}

/** Helper functions of core that plugins call into. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- extended as plugins are converted
export interface OpHelpers {}

export interface OpPluginContext {
	services: OpServices;
	helpers: OpHelpers;
	// Runs the callback inside Angular's zone.
	runInZone<T>(callback: () => T): T;
}

/** Value of the `openProject` key of the editor configuration. */
export interface OpConfig {
	context: OpContext;
	pluginContext: OpPluginContext;
	helpURL?: string;
	disableAllMacros?: boolean;
}

/** A function that reads the editor from `this`, as mention feeds do. */
export type EditorBound<Args extends unknown[], Result> = (this: Editor, ...args: Args) => Result;

declare module '@ckeditor/ckeditor5-core' {
	interface EditorConfig {
		openProject?: OpConfig;
		disabledMentions?: string[];
	}
}
