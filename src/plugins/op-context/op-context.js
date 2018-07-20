export function getOP(editor) {
	return editor.config.get('openProject');
}

export function getOPService(editor, name) {
	return editor.config.get('openProject.pluginContext').services[name];
}

export function getOPResource(editor) {
	return editor.config.get('openProject.context.resource');
}

export function getOPPreviewContext(editor) {
	return editor.config.get('openProject.context.previewContext');
}

export function getOPPath(editor, pathName) {
	return getOPService(editor,'pathHelperService');

}
