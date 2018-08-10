import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {setupAtJs} from './op-atjs-plugin/atjs-setup';

export default class OPLinkingWpPlugin extends Plugin {

	static get pluginName() {
		return 'OPLinkingWp';
	}

	init() {
		const editor = this.editor;


		let options = {
			ignorePrefix: /user\#/,
			remoteUrl: function(query, func) {
				let url = window.OpenProject.urlRoot + `/work_packages/auto_complete.json`;

				jQuery.getJSON(url, {q: query, scope: 'all'}, func)
			},
			remoteDataPreparation: function(data) {
				for (let i = data.length - 1; i >= 0; i--) {
					data[i]['id_subject'] = data[i]['id'].toString() + ' ' + data[i]['subject'];
				}

				return data;
			}
		};

		setupAtJs(editor, options);
	}
}
