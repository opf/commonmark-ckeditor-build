import type { Editor } from '@ckeditor/ckeditor5-core';
import type {
	OpConfig,
	OpHelpers,
	OpPluginContext,
	OpResource,
	OpServices,
} from '../../op-types';

// `_config` is private in CKEditor's typings. The accessors below read the
// raw configuration object through it.
type RawConfig = undefined | {
	_config?: {
		openProject?: OpConfig;
	};
};

export function getOP(editor: Editor): OpConfig | undefined {
	return (editor.config as unknown as RawConfig)?._config?.openProject;
}

export function getOPResource(editor: Editor): OpResource | undefined {
	return (editor.config as unknown as RawConfig)?._config?.openProject?.context?.resource;
}

export function getOPFieldName(editor: Editor): string | undefined {
	return (editor.config as unknown as RawConfig)?._config?.openProject?.context?.field;
}

export function getPluginContext(editor: Editor): OpPluginContext | undefined {
	return (editor.config as unknown as RawConfig)?._config?.openProject?.pluginContext;
}

// Core always passes a plugin context. Its absence is a bug in core, so it
// is reported by name instead of surfacing as a TypeError.
function requirePluginContext(editor: Editor): OpPluginContext {
	const pluginContext = getPluginContext(editor);

	if (!pluginContext) {
		throw new Error('CKEditor: openProject.pluginContext is missing');
	}

	return pluginContext;
}

export function getOPService<K extends keyof OpServices>(editor: Editor, name: K): OpServices[K] {
	return requirePluginContext(editor).services[name];
}

export function getOPHelper<K extends keyof OpHelpers>(editor: Editor, name: K): OpHelpers[K] {
	return requirePluginContext(editor).helpers[name];
}

export function getOPPath(editor: Editor) {
	return getOPService(editor,'pathHelperService');
}

export function getOPI18n(editor: Editor) {
	return getOPService(editor,'i18n');
}
