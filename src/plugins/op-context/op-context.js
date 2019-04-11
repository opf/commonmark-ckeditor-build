export function getOP(editor) {
	return _.get(editor.config, '_config.openProject');
}

export function getOPService(editor, name) {
	return getPluginContext(editor).services[name];
}

export function getPluginContext(editor) {
	return _.get(editor.config, '_config.openProject.pluginContext');
}

export function getOPResource(editor) {
	return _.get(editor.config, '_config.openProject.context.resource');
}

export function getOPPreviewContext(editor) {
	return _.get(editor.config, '_config.openProject.context.previewContext');
}

export function getOPPath(editor, pathName) {
	return getOPService(editor,'pathHelperService');

}
