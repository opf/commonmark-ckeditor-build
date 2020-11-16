import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class OpCustomCssClassesPlugin extends Plugin {

	init() {
		this._addCustomCSSClasses();
	}

	_addCustomCSSClasses() {
		const elementsWithCustomClassesNamesMap = {
			'paragraph': 'p',
			'heading1': 'h1',
			'heading2': 'h2',
			'heading3': 'h3',
			'heading4': 'h4',
			'heading5': 'h5',
			'heading6': 'h6',
			'listItem': 'list--item',
			'blockQuote': 'blockquote',
		};

		Object.keys(elementsWithCustomClassesNamesMap).forEach(elementKey => {
			this.editor.conversion.for( 'editingDowncast' ).add( dispatcher => {
				dispatcher.on( `insert:${elementKey}`, ( evt, data, conversionApi ) => {
					const viewWriter = conversionApi.writer;

					viewWriter.addClass( `op-uc-${elementsWithCustomClassesNamesMap[elementKey]}`, conversionApi.mapper.toViewElement( data.item ) );
				}, { priority: 'low' } );
			});
		})
	}
}
