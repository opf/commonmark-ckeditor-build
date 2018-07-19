import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';

import {isEmbeddedTableWidgetSelected} from './utils';
import {createToolbarEditButton} from '../../helpers/create-toolbar-edit-button';
import {createEditToolbar} from '../../helpers/create-toolbar';


const balloonClassName = 'ck-toolbar-container';

export default class EmbeddedTableToolbar extends Plugin {
	static get requires() {
		return [ ContextualBalloon ];
	}

	static get pluginName() {
		return 'EmbeddedTableToolbar';
	}

	init() {
		const editor = this.editor;
		const model = this.editor.model;
		const pluginContext = editor.config.get('openProject.pluginContext');

		// Add editing button
		createToolbarEditButton( editor, 'opEditEmbeddedTableQuery', widget => {
			const externalQueryConfiguration = pluginContext.services.externalQueryConfiguration;
			const currentQuery = widget.getAttribute('opEmbeddedTableQuery') || {};

			externalQueryConfiguration.show(
				currentQuery,
				(newQuery) => model.change(writer => {
					writer.setAttribute( 'opEmbeddedTableQuery', newQuery, widget );
				})
			);
		} );
	}

	afterInit() {
		// Add actual toolbar
		createEditToolbar(
			this,
			this.editor,
			'OPMacroEmbeddedTable',
			isEmbeddedTableWidgetSelected
		);
	}
}
