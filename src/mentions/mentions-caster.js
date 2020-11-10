import {getPluginContext} from "../plugins/op-context/op-context";

export function MentionCaster( editor ) {
	const pluginContext = getPluginContext(editor);

	// The upcast converter will convert <mention data-id...></mention> elements
	// on the input HTML data to the model 'mention' attribute.
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
				const typesPathMap = {
					user: 'users',
					group: 'groups',
				}
				const id = viewItem.getAttribute( 'data-id' );
				const type = viewItem.getAttribute( 'data-type' );
				const base = window.OpenProject.urlRoot;
				const typeSegment = pluginContext.services.apiV3Service[typesPathMap[type]].segment;
				const link = `${base}/${typeSegment}/${id}`;
				const text = viewItem.getAttribute( 'data-text' );
				// The mention feature expects that the mention attribute value
				// in the model is a plain object with a set of additional attributes.
				// In order to create a proper object use the toMentionAttribute() helper method:
				const mentionAttribute = editor.plugins.get( 'Mention' ).toMentionAttribute( viewItem, {
					// Pass the properties we'll need for the editing and data downcast.
					id,
					link,
					text,
					type,
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
						'data-text': modelAttributeValue.text,
					}
				);

				return element;
			}
		});
}
