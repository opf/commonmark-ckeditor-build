import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class OpCustomCssClassesPlugin extends Plugin {

	init() {
		this._addCSSClasses();
	}

	_addCSSClasses() {
		const elementsWithCustomClasses = [
			'paragraph',
			'heading1',
			'heading2',
			'heading3',
			'heading4',
			'heading5',
			'heading6',
			'figure',
			'image',
			'table',
			'listItem',
			'blockQuote',
		];

		elementsWithCustomClasses.forEach(element => {
			this.editor.conversion.for( 'editingDowncast' ).add( dispatcher => {
				dispatcher.on( `insert:${element}`, ( evt, data, conversionApi ) => {
					const viewWriter = conversionApi.writer;
					console.log(`insert:${element}`, data.item, data.item.getAttribute('listType'), viewWriter, this);

					viewWriter.addClass( `op-${element}`, conversionApi.mapper.toViewElement( data.item ) );
				}, { priority: 'low' } );
			});
		})
	}
}
