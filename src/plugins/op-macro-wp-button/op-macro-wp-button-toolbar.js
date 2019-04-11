import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';

import {isWpButtonMacroWidgetSelected} from './utils';
import {createToolbarEditButton} from '../../helpers/create-toolbar-edit-button';
import {createEditToolbar} from '../../helpers/create-toolbar';
import {getPluginContext} from '../op-context/op-context';


const balloonClassName = 'ck-toolbar-container';

export default class OPMacroWpButtonToolbar extends Plugin {
	static get requires() {
		return [ ContextualBalloon ];
	}

	static get pluginName() {
		return 'OPMacroWpButtonToolbar';
	}

	init() {
		const editor = this.editor;
		const model = this.editor.model;
		const pluginContext = getPluginContext(editor);

		// Add editing button
		createToolbarEditButton( editor, 'opEditWpMacroButton', widget => {
			const macroService = pluginContext.services.macros;
			const type = widget.getAttribute('type');
			const classes = widget.getAttribute('classes');

			macroService
				.configureWorkPackageButton(type, classes)
				.then((result) => editor.model.change(writer => {
					writer.setAttribute( 'classes', result.classes, widget );
					writer.setAttribute( 'type', result.type, widget );
				})
			);
		} );
	}

	afterInit() {
		// Add actual toolbar
		createEditToolbar(
			this,
			this.editor,
			'OPMacroWpButton',
			isWpButtonMacroWidgetSelected
		);
	}
}
