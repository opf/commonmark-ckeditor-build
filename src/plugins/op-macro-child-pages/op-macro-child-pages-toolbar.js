import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';

import {isChildPagesMacroWidgetSelected} from './utils';
import {createToolbarEditButton} from '../../helpers/create-toolbar-edit-button';
import {createEditToolbar} from '../../helpers/create-toolbar';


const balloonClassName = 'ck-toolbar-container';

export default class OPChildPagesToolbar extends Plugin {
	static get requires() {
		return [ ContextualBalloon ];
	}

	static get pluginName() {
		return 'OPChildPagesToolbar';
	}

	init() {
		const editor = this.editor;
		const model = this.editor.model;
		const pluginContext = editor.config.get('openProject.pluginContext');

		// Add editing button
		createToolbarEditButton( editor, 'opEditChildPagesMacroButton', widget => {
			const macroService = pluginContext.services.macros;
			const pageAttribute = widget.getAttribute('page');
			const includeParent = widget.getAttribute('includeParent');
			const page = (pageAttribute && pageAttribute.length > 0) ? pageAttribute : '';
			macroService
				.configureChildPages(page, includeParent)
				.then((macroConf) => model.change(writer => {
						writer.setAttribute( 'page', macroConf.page, widget );
						writer.setAttribute( 'includeParent', macroConf.includeParent, widget );
					})
				);
		} );
	}

	afterInit() {
		// Add actual toolbar
		createEditToolbar(
			this,
			this.editor,
			'OPChildPages',
			isChildPagesMacroWidgetSelected
		);
	}
}
