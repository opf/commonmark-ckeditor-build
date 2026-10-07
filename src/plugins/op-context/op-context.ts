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

export function getOPService<K extends keyof OpServices>(editor: Editor, name: K): OpServices[K] {
	// TODO(OP-18993): throws when the editor has no plugin context.
	return getPluginContext(editor)!.services[name];
}

export function getOPHelper<K extends keyof OpHelpers>(editor: Editor, name: K): OpHelpers[K] {
	// TODO(OP-18993): throws when the editor has no plugin context.
	return getPluginContext(editor)!.helpers[name];
}

export function getOPPath(editor: Editor) {
	return getOPService(editor,'pathHelperService');
}

export function getOPI18n(editor: Editor) {
	return getOPService(editor,'i18n');
}
