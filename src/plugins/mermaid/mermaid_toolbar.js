import { Plugin } from '@ckeditor/ckeditor5-core';
import { WidgetToolbarRepository } from '@ckeditor/ckeditor5-widget';

export default class MermaidToolbar extends Plugin {

	static get requires() {
		return [ WidgetToolbarRepository ];
	}

	static get pluginName() {
		return 'MermaidToolbar';
	}

	afterInit() {
		const editor = this.editor;
		const t = editor.t;

		editor.plugins.get( WidgetToolbarRepository ).register( 'mermaidToolbar', {
			ariaLabel: t( 'Mermaid toolbar' ),
			items: [ 'mermaidSourceView', 'mermaidSplitView', 'mermaidPreview', '|', 'mermaidInfo' ],
			getRelatedElement: selection => getSelectedElement( selection )
		} );
	}
}

function getSelectedElement( selection ) {
	const viewElement = selection.getSelectedElement();

	if ( viewElement && viewElement.hasClass( 'ck-mermaid__wrapper' ) ) {
		return viewElement;
	}

	return null;
}
