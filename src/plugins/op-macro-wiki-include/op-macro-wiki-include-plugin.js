import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import OPWikiIncludePageEditing from './op-macro-wiki-include-editing';
import OPWikiIncludePageToolbar from './op-macro-wiki-include-toolbar';

export default class OPWikiIncludePagePlugin extends Plugin {
	static get requires() {
		return [ OPWikiIncludePageEditing, Widget, OPWikiIncludePageToolbar ];
	}

	static get pluginName() {
		return 'OPWikiIncludePage';
	}

	static get buttonName() {
		return OPWikiIncludePageEditing.buttonName;
	}
}
