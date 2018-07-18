export function getOP(editor) {
	return editor.config.get('openProject');
}

export function getOPService(editor, name) {
	return editor.config.get('openProject.pluginContext').services[name];
}

export function getOPContext(editor) {
	return editor.config.get('openProject.context.resource');
}

export function getOPPath(editor, pathName) {
	return getOPService(editor,'pathHelperService');

}
