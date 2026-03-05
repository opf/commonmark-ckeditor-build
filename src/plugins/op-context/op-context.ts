import type { Editor } from '@ckeditor/ckeditor5-core';

export function getOP(editor:Editor) {
	return _.get(editor.config, '_config.openProject');
}

export function getOPResource(editor:Editor) {
	return _.get(editor.config, '_config.openProject.context.resource');
}

export function getOPFieldName(editor:Editor) {
	return _.get(editor.config, '_config.openProject.context.field');
}

export function getOPPreviewContext(editor:Editor) {
	return _.get(editor.config, '_config.openProject.context.previewContext');
}

export function getPluginContext(editor:Editor) {
	return _.get(editor.config, '_config.openProject.pluginContext');
}

export function getOPService(editor:Editor, name:string) {
	return getPluginContext(editor).services[name];
}

export function getOPHelper(editor:Editor, name:string) {
	return getPluginContext(editor).helpers[name];
}

export function getOPPath(editor:Editor) {
	return getOPService(editor,'pathHelperService');
}

export function getOPI18n(editor:Editor) {
	return getOPService(editor,'i18n');
}
