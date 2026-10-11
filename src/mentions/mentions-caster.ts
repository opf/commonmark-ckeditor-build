import {getPluginContext} from "../plugins/op-context/op-context";
import type { Editor } from '@ckeditor/ckeditor5-core';
import { ClickObserver } from '@ckeditor/ckeditor5-engine';
import type {
	DowncastConversionApi,
	MatcherObjectPattern,
	ModelElement,
	ViewDocumentClickEvent,
	ViewElement,
	ViewText,
} from '@ckeditor/ckeditor5-engine';
import type { OpMention } from '../op-types';
import { isWorkPackageQuickinfoMention } from '../plugins/op-macro-wp-quickinfo/predicate';

export function MentionCaster( editor: Editor ) {
	const pluginContext = getPluginContext(editor);
	const view = editor.editing.view;
	const viewDocument = view.document;

	view.addObserver(ClickObserver);

	// Open mention links, in a new tab
	editor.listenTo<ViewDocumentClickEvent>(viewDocument, 'click', (evt, data) => {
		if (data.domTarget.nodeName === 'A' &&  data.domTarget.classList.contains('mention')) {
			const link = document.createElement('a');
			link.target = '_blank';
			// Attributes are also reachable by name, which NamedNodeMap's typing does not express.
			link.href = (data.domTarget.attributes as NamedNodeMap & { href: Attr }).href.value;

			link.click();
		}
	});

	// The upcast converter will convert <mention data-id="id" data-type="type" data-text="text">text</mention>
	// elements on the input HTML data to the model 'mention' attribute.
	editor.conversion
		.for( 'upcast' )
		.elementToAttribute( {
			// TODO(OP-18993): `key` is not a property of a matcher pattern and is ignored.
			view: {
				name: 'mention',
				key: 'data-mention',
				classes: 'mention',
			} as MatcherObjectPattern,
			model: {
				key: 'mention',
				value: (viewItem: ViewElement) => {
					const dataId = viewItem.getAttribute( 'data-id' );
					const dataDisplayId = viewItem.getAttribute( 'data-display-id' );
					const type = viewItem.getAttribute( 'data-type' );
					const text = viewItem.getAttribute( 'data-text' );

					// Multi-hash work-package mentions are routed to the
					// quickinfo widget model (`op-macro-wp-quickinfo`) by
					// that plugin's upcast. Returning `null` here keeps the
					// mention attribute off the text node so the widget
					// model is the sole representation.
					if (isWorkPackageQuickinfoMention(viewItem)) {
						return null;
					}

					// `link` populates the editor-view `<a href>` only; the
					// data downcast doesn't persist it.
					const link = getMentionLink( dataDisplayId || dataId, type );

					// CKEditor types this parameter as a model element, but documents and treats it as a view element.
					return editor.plugins.get( 'Mention' ).toMentionAttribute( viewItem as unknown as ModelElement, {
						dataId,
						dataDisplayId,
						link,
						text,
						type,
					} );
				}
			},
			converterPriority: 'high'
		} );

	// Handle mysterious corrupted mentions (<span class="mention" data-type="">${@user or #wp id}</span>)
	editor.conversion
		.for( 'upcast' )
		.elementToAttribute( {
		// TODO(OP-18993): `key` is not a property of a matcher pattern and is ignored.
		view: {
			name: 'span',
			key: 'data-mention',
			classes: 'mention',
		} as MatcherObjectPattern,
		model: {
			key: 'mention',
			value: (viewItem: ViewElement) => {
				const children = [...viewItem.getChildren()];
				// Such a span holds a single text node.
				const content = children[0] as ViewText | undefined;
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
			view: (modelAttributeValue: OpMention | undefined, {writer}: DowncastConversionApi) => {
				// Do not convert empty attributes (lack of value means no mention).
				if ( !modelAttributeValue ) {
					return;
				}

				if (modelAttributeValue.type === 'emoji') {
					return writer.createAttributeElement('span');
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
			view: (modelAttributeValue: OpMention | undefined, {writer}: DowncastConversionApi) => {
				// Do not convert empty attributes (lack of value means no mention).
				if ( !modelAttributeValue ) {
					return;
				}

				if (modelAttributeValue.type === 'emoji') {
					return writer.createAttributeElement('span');
				}

				const attrs: Record<string, string | number | undefined> = {
					'class': 'mention',
					'data-id': modelAttributeValue.dataId,
					'data-type': modelAttributeValue.type,
					'data-text': modelAttributeValue.text,
				};
				if (modelAttributeValue.dataDisplayId) {
					attrs['data-display-id'] = modelAttributeValue.dataDisplayId;
				}
				const element = writer.createAttributeElement('mention', attrs);

				return element;
			}
		});

	function getMentionLink(id: string | undefined, type: string | undefined) {
		const typePath = pluginContext!.services.apiV3Service[`${type}s`].segment;
		const base = window.OpenProject.urlRoot;

		return `${base}/${typePath}/${id}`;
	}
}
