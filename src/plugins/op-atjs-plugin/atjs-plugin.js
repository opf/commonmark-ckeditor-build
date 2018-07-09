import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import AtJsEnterCommand from './atjs-enter-command';

export class AtJsPlugin extends Plugin {

	static get pluginName() {
		return 'atjs';
	}

	static get requires() {
		return [ AtJsEnterCommand ];
	}

	init() {
		const editor = this.editor;

		editor.commands.get("enter").destroy();
		editor.commands.add("enter", new AtJsEnterCommand(editor) );
	}
}
