import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {setupAtJs} from './op-atjs-plugin/atjs-setup';

export default class OPMentioningPlugin extends Plugin {

	static get pluginName() {
		return 'OPMentioning';
	}

	init() {
		const editor = this.editor;
		const getOPService = function(name) {
			return editor.config.openProject.pluginContext.services[name];
		};
		const getOPContext = function() {
			const opConfig = editor.config.openProject;

			return opConfig && opConfig.context;
		}

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
				const sanitizer = getOPService('htmlSanitizeService');

				for (let i = principals.length - 1; i >= 0; i--) {
					principals[i]['id_principal'] = sanitizer.sanitize(principals[i]['id'].toString() + ' ' + principals[i]['name']);
					principals[i]['typePrefix'] = principals[i]['_type'].toLowerCase();
				}

				return principals;
			},
			isSupportedContext: function() {
				const context = getOPContext();

				return context && context._type === 'WorkPackage'
			},
			remoteUrl: function(query, func) {
				const url = getOPService('pathHelperService').api.v3.principals(getOPContext().project.id, query);

                jQuery.getJSON(url, func);
			}
		};

		setupAtJs(editor, options);
	}
}
