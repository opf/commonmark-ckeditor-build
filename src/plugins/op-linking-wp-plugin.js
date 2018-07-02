import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {setupAtJs} from './op-atjs-plugin/atjs-setup';

export default class OPLinkingWpPlugin extends Plugin {

	static get pluginName() {
		return 'OPLinkingWp';
	}

	init() {
		const editor = this.editor;
		const url = window.OpenProject.urlRoot + '/work_packages/auto_complete.json';

		setupAtJs(editor, url);
	}
}
