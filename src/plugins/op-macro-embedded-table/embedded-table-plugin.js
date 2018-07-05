import EmbeddedTableEditing from './embedded-table-editing';
import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import EmbeddedTableToolbar from './embedded-table-toolbar';

export default class OPMacroEmbeddedTable extends Plugin {
	static get requires() {
		return [ EmbeddedTableEditing, Widget, EmbeddedTableToolbar ];
	}

	static get pluginName() {
		return 'OPMacroEmbeddedTable';
	}
}
