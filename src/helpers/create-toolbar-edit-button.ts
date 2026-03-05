import imageIcon from '../icons/edit.svg';
import { ButtonView } from '@ckeditor/ckeditor5-ui';
import type {Editor} from '@ckeditor/ckeditor5-core';
import type ModelElement from '@ckeditor/ckeditor5-engine/src/model/element';

type EditToolbarCallback = (widget:ModelElement) => void;

export function createToolbarEditButton(editor:Editor, name:string, callback:EditToolbarCallback) {
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
