import imageIcon from '../icons/edit.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

export function createToolbarEditButton(editor, name, callback) {
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
