export function getOP(editor) {
	return _.get(editor.config, '_config.openProject');
}

export function getOPResource(editor) {
	return _.get(editor.config, '_config.openProject.context.resource');
}

export function getOPFieldName(editor) {
	return _.get(editor.config, '_config.openProject.context.field');
}

export function getOPPreviewContext(editor) {
	return _.get(editor.config, '_config.openProject.context.previewContext');
}

export function getPluginContext(editor) {
	return _.get(editor.config, '_config.openProject.pluginContext');
}

export function getOPService(editor, name) {
	return getPluginContext(editor).services[name];
}

export function getOPHelper(editor, name) {
	return getPluginContext(editor).helpers[name];
}

export function getOPPath(editor) {
	return getOPService(editor,'pathHelperService');
}

export function getOPI18n(editor) {
	return getOPService(editor,'i18n');
}
