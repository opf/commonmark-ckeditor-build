
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import CodeBlockEditing from './code-block-editing';

export default class CodeBlockPlugin extends Plugin {
	static get pluginName() {
		return 'CodeBlock';
	}

	static get requires() {
		return [ CodeBlockEditing ];
	}
}
