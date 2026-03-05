import { Widget } from '@ckeditor/ckeditor5-widget';
import { Plugin } from '@ckeditor/ckeditor5-core';
import OPChildPagesEditing from './op-macro-child-pages-editing';
import OPChildPagesToolbar from './op-macro-child-pages-toolbar';

export default class OPChildPagesPlugin extends Plugin {
	static get requires() {
		return [ OPChildPagesEditing, Widget, OPChildPagesToolbar ];
	}

	static get pluginName() {
		return 'OPChildPages';
	}

	static get buttonName() {
		return OPChildPagesEditing.buttonName;
	}
}
