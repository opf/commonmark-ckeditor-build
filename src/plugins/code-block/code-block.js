
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import CodeBlockEditing from './code-block-editing';
import CodeBlockToolbar from './code-block-toolbar';

export default class CodeBlockPlugin extends Plugin {
	static get pluginName() {
		return 'CodeBlock';
	}

	static get requires() {
		return [ CodeBlockEditing, CodeBlockToolbar ];
	}
}
