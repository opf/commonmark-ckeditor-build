import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';

import {isWikiIncludeMacroWidgetSelected} from './utils';
import {createToolbarEditButton} from '../../helpers/create-toolbar-edit-button';
import {createEditToolbar} from '../../helpers/create-toolbar';
import {getPluginContext} from '../op-context/op-context';


const balloonClassName = 'ck-toolbar-container';

export default class OPWikiIncludePageToolbar extends Plugin {
	static get requires() {
		return [ ContextualBalloon ];
	}

	static get pluginName() {
		return 'OPWikiIncludePageToolbar';
	}

	init() {
		const editor = this.editor;
		const model = this.editor.model;
		const pluginContext = getPluginContext(editor);

		// Add editing button
		createToolbarEditButton( editor, 'opEditWikiIncludeMacroButton', widget => {
			const macroService = pluginContext.services.macros;
			const page = widget.getAttribute('page');

			macroService
				.configureWikiPageInclude(page)
				.then((newPage) => editor.model.change(writer => {
					writer.setAttribute( 'page', newPage, widget );
				})
			);
		} );
	}

	afterInit() {
		// Add actual toolbar
		createEditToolbar(
			this,
			this.editor,
			'OPWikiIncludePage',
			isWikiIncludeMacroWidgetSelected
		);
	}
}
