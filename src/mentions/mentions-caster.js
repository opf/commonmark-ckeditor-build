export function MentionCaster( editor ) {
    // The upcast converter will convert <a class="mention" href="" data-user-id="">
    // elements to the model 'mention' attribute.
    editor.conversion.for( 'upcast' ).elementToAttribute( {
        view: {
            name: 'a',
            key: 'data-mention',
            classes: 'mention',
            attributes: {
                href: true,
                'data-user-id': true
            }
        },
        model: {
            key: 'mention',
            value: viewItem => {
                // The mention feature expects that the mention attribute value
                // in the model is a plain object with set of additional attributes.
                // In order to create proper object use `toMentionAttribute` helper method:
                const mentionAttribute = editor.plugins.get( 'Mention' ).toMentionAttribute( viewItem, {
                    // Add any other properties that you need.
                    link: viewItem.getAttribute( 'href' ),
                    userId: viewItem.getAttribute( 'data-user-id' )
                } );

                return mentionAttribute;
            }
        },
        converterPriority: 'high'
	} );

	// editor.conversion
	// 	.for( 'editingDowncast' )
	// 	.attributeToElement( {
	// 		model: 'mention',
	// 		converterPriority: 'high',
	// 		view: ( modelAttributeValue, viewWriter ) => {
	// 			// Do not convert empty attributes (lack of value means no mention).
	// 			if ( !modelAttributeValue ) {
	// 				return;
	// 			}

	// 			return viewWriter.createAttributeElement( 'a', {
	// 				class: 'mention',
	// 				'data-type': modelAttributeValue.type,
	// 				'data-mention': modelAttributeValue.id,
	// 				'href': modelAttributeValue.link
	// 			} );
	// 		},
	// 	} );

	editor.conversion
		.for('downcast')
		.attributeToElement({
			model: 'mention',
			converterPriority: 'high',
			view: (modelAttributeValue, {writer}) => {
				// Do not convert empty attributes (lack of value means no mention).
				if ( !modelAttributeValue ) {
					return;
				}

				const element = writer.createAttributeElement(
					'span',
					{
						'class': 'mention',
						'data-type': modelAttributeValue.type || '',
					}
				);

				return element;
			}
		});
}
