export function MentionCaster( editor ) {
	// The upcast converter will convert <a class="mention" href="" data-user-id="">
	// elements to the model 'mention' attribute.
	editor.conversion
		.for( 'upcast' )
		.elementToAttribute( {
		view: {
			name: 'mention',
			key: 'data-mention',
			classes: 'mention',
		},
		model: {
			key: 'mention',
			value: viewItem => {
				// The mention feature expects that the mention attribute value
				// in the model is a plain object with a set of additional attributes.
				// In order to create a proper object use the toMentionAttribute() helper method:
				const mentionAttribute = editor.plugins.get( 'Mention' ).toMentionAttribute( viewItem, {
					// Pass the properties we'll need for the editing and data downcast.
					id: viewItem.getAttribute( 'data-id' ),
					link: viewItem.getAttribute( 'data-link' ),
					text: viewItem.getAttribute( 'data-text' ),
					type: viewItem.getAttribute( 'data-type' ),
				} );

				return mentionAttribute;
			}
		},
		converterPriority: 'high'
	} );

	editor.conversion
		.for('editingDowncast')
		.attributeToElement({
			model: 'mention',
			converterPriority: 'high',
			view: (modelAttributeValue, {writer}) => {
				// Do not convert empty attributes (lack of value means no mention).
				if ( !modelAttributeValue ) {
					return;
				}

				const element = writer.createAttributeElement(
					'a',
					{
						'class': 'mention',
						'href': modelAttributeValue.link,
						'data-mention': modelAttributeValue.id.startsWith('@') ?
											modelAttributeValue.id :
											`@${modelAttributeValue.id}`,
						'title': modelAttributeValue.text,
					}
				);

				return element;
			}
		});

	editor.conversion
		.for('dataDowncast')
		.attributeToElement({
			model: 'mention',
			converterPriority: 'high',
			view: (modelAttributeValue, {writer}) => {
				// Do not convert empty attributes (lack of value means no mention).
				if ( !modelAttributeValue ) {
					return;
				}

				const element = writer.createAttributeElement(
					'mention',
					{
						'class': 'mention',
						'data-id': modelAttributeValue.id.replace('@', ''),
						'data-type': modelAttributeValue.type,
						'data-link': modelAttributeValue.link,
						'data-text': modelAttributeValue.text,
					}
				);

				return element;
			}
		});
}
