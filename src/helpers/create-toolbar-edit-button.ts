import imageIcon from '../icons/edit.svg';
import type { Editor } from '@ckeditor/ckeditor5-core';
import type { ModelElement } from '@ckeditor/ckeditor5-engine';
import { ButtonView } from '@ckeditor/ckeditor5-ui';

export function createToolbarEditButton(editor: Editor, name: string, callback: (widget: ModelElement) => void) {
	// Add editing button
	editor.ui.componentFactory.add( name, locale => {
		const view = new ButtonView( locale );

		view.set( {
			label: I18n.t('js.button_edit'),
			icon: imageIcon,
			tooltip: true
		} );

		// Callback executed once the widget is clicked.
		view.on( 'execute', () => {

			const widget = editor.model.document.selection.getSelectedElement();

			if (!widget) {
				return;
			}

			callback(widget);
		} );

		return view;
	} );
}
