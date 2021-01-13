import {getPluginContext} from "../plugins/op-context/op-context";
import ClickObserver from '@ckeditor/ckeditor5-engine/src/view/observer/clickobserver';


export function MentionCaster( editor ) {
	const pluginContext = getPluginContext(editor);
	const view = editor.editing.view;
	const viewDocument = view.document;

	view.addObserver(ClickObserver);

	// Open mention links, in a new tab
	editor.listenTo(viewDocument, 'click', (evt, data) => {
		if (data.domTarget.nodeName === 'A' &&  data.domTarget.classList.contains('mention')) {
			const link = document.createElement('a');
			link.target = '_blank';
			link.href = data.domTarget.attributes.href.value;

			link.click();
		}
	});

	// The upcast converter will convert <mention data-id="id" data-type="type" data-text="text">text</mention>
	// elements on the input HTML data to the model 'mention' attribute.
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
					const idNumber = viewItem.getAttribute( 'data-id' );
					const type = viewItem.getAttribute( 'data-type' );
					const text = viewItem.getAttribute( 'data-text' );
					const link = getMentionLink(idNumber, type);
					// The mention feature expects that the mention attribute value
					// in the model is a plain object with a set of additional attributes.
					// In order to create a proper object use the toMentionAttribute() helper method:
					const mentionAttribute = editor.plugins.get( 'Mention' ).toMentionAttribute( viewItem, {
						// Pass the properties we'll need for the editing and data downcast.
						idNumber,
						link,
						text,
						type,
					} );

					return mentionAttribute;
				}
			},
			converterPriority: 'high'
		} );

	// Handle mysterious corrupted mentions (<span class="mention" data-type="">${@user or #wp id}</span>)
	editor.conversion
		.for( 'upcast' )
		.elementToAttribute( {
		view: {
			name: 'span',
			key: 'data-mention',
			classes: 'mention',
		},
		model: {
			key: 'mention',
			value: viewItem => {
				const children = [...viewItem.getChildren()];
				const content = children[0];
				const text = content && content.data;

				if (text) {
					const errorMessage = `[Invalid mention: ${text}]`;
					content._data = errorMessage;
				}

				return;
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
						'data-mention': modelAttributeValue.text,
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
						'data-id': modelAttributeValue.idNumber,
						'data-type': modelAttributeValue.type,
						'data-text': modelAttributeValue.text,
					}
				);

				return element;
			}
		});

	function getMentionLink(id, type) {
		const typePathBase = pluginContext.services.apiV3Service[`${type}s`].segment;
		const typePath = type === 'group' ? `admin/${typePathBase}` : typePathBase;
		const base = window.OpenProject.urlRoot;

		return `${base}/${typePath}/${id}`;
	}
}
