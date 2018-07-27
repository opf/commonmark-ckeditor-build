import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {setupAtJs} from './op-atjs-plugin/atjs-setup';
import {getOPService, getOPResource, getOPPath} from './op-context/op-context';

export default class OPMentioningPlugin extends Plugin {

	static get pluginName() {
		return 'OPMentioning';
	}

	init() {
		const editor = this.editor;

		let options = {
			searchKey: 'id_principal',
			displayTpl: '<li data-value="#{_type}#${id}">${name}</li>',
			insertTpl: "${typePrefix}#${id}",
			startWithSpace: true,
			suffix: '',
			acceptSpaceBar: true,
			highlightFirst: true,
			at: '@',
			remoteDataPreparation: function(data) {
				const principals = data["_embedded"]["elements"];
				const sanitizer = getOPService(editor, 'htmlSanitizeService');

				for (let i = principals.length - 1; i >= 0; i--) {
					principals[i]['id_principal'] = sanitizer.sanitize(principals[i]['id'].toString() + ' ' + principals[i]['name']);
					principals[i]['typePrefix'] = principals[i]['_type'].toLowerCase();
				}

				return principals;
			},
			isSupportedContext: function() {
				let context = getOPResource(editor);
				return context && context._type === 'WorkPackage';
			},
			remoteUrl: function(query, func) {
				const resource = getOPResource(editor);
				const project_id = resource.project.idFromLink;
				const url = getOPPath(editor).api.v3.principals(project_id, query);

                jQuery.getJSON(url, func);
			}
		};
;
		setupAtJs(editor, options);
	}
}
