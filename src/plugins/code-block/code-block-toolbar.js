import { Plugin } from '@ckeditor/ckeditor5-core';
import { ContextualBalloon } from '@ckeditor/ckeditor5-ui';

import {createToolbarEditButton} from '../../helpers/create-toolbar-edit-button';
import {createEditToolbar} from '../../helpers/create-toolbar';
import {isCodeBlockWidgetSelected} from './widget';
import {getPluginContext} from '../op-context/op-context';

export default class CodeBlockToolbar extends Plugin {
	static get requires() {
		return [ ContextualBalloon ];
	}

	static get pluginName() {
		return 'CodeBlockToolbar';
	}

	init() {
		const editor = this.editor;
		const model = this.editor.model;
		const pluginContext = getPluginContext(editor);

		// Add editing button
		createToolbarEditButton( editor, 'opEditCodeBlock', widget => {
			const macroService = pluginContext.services.macros;
			const language = widget.getAttribute( 'opCodeblockLanguage' );
			const content = widget.getAttribute( 'opCodeblockContent' );

			macroService
				.editCodeBlock( content, language )
				.then((update) => model.change(writer => {
					writer.setAttribute( 'opCodeblockLanguage', update.languageClass, widget );
					writer.setAttribute( 'opCodeblockContent', update.content, widget );
				})
			);
		} );
	}

	afterInit() {
		// Add actual toolbar
		createEditToolbar(
			this,
			this.editor,
			'OPCodeBlock',
			isCodeBlockWidgetSelected
		);
	}
}
