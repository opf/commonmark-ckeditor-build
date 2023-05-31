import EmbeddedTableEditing from './embedded-table-editing';
import { Widget } from '@ckeditor/ckeditor5-widget';
import { Plugin } from '@ckeditor/ckeditor5-core';
import EmbeddedTableToolbar from './embedded-table-toolbar';

export default class OPMacroEmbeddedTable extends Plugin {
	static get requires() {
		return [ EmbeddedTableEditing, Widget, EmbeddedTableToolbar ];
	}

	static get pluginName() {
		return 'OPMacroEmbeddedTable';
	}

	static get buttonName() {
		return EmbeddedTableEditing.buttonName;
	}
}
