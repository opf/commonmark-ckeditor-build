import { Plugin } from "@ckeditor/ckeditor5-core";
import { toWidget } from "@ckeditor/ckeditor5-widget";
import { getOPPath } from "../op-context/op-context";

const MODEL_ELEMENT_NAME = 'op-macro-wiki-page-link';

export default class OpMacroWikiPageLinkPlugin extends Plugin {
	static get pluginName() {
		return 'OpMacroWikiPageLink';
	}

	init() {
		const editor = this.editor;
		const conversion = editor.conversion;

		editor.model.schema.register(MODEL_ELEMENT_NAME, {
			allowWhere: '$text',
			isInline: true,
			isObject: true,
			allowAttributes: ['providerId', 'pageIdentifier'],
		});

		conversion.for('upcast').elementToElement({
			view: { name: 'turbo-frame', attributes: { 'data-type': 'wiki-page-link' } },
			model: (viewElement, { writer }) => {
				const providerId = viewElement.getAttribute('data-provider-id');
				const pageIdentifier = viewElement.getAttribute('data-page-identifier');
				return writer.createElement(MODEL_ELEMENT_NAME, { providerId, pageIdentifier });
			},
		});

		conversion.for('dataDowncast').elementToElement({
			model: MODEL_ELEMENT_NAME,
			view: (modelElement, { writer }) => {
				const providerId = modelElement.getAttribute('providerId');
				const pageIdentifier = modelElement.getAttribute('pageIdentifier');
				const frameId = crypto.randomUUID();

				const container = writer.createContainerElement(
					'turbo-frame',
					{
						id: frameId,
						src: this.macroUrl(providerId, pageIdentifier, frameId),
						'data-provider-id': providerId,
						'data-page-identifier': pageIdentifier,
						'data-type': 'wiki-page-link',
					});

				const ref = `[[[${providerId}:${pageIdentifier}]]]`;
				writer.insert(writer.createPositionAt(container, 0), writer.createText(ref));
				return container;
			},
		});

		conversion.for('editingDowncast').elementToElement({
			model: MODEL_ELEMENT_NAME,
			view: (modelElement, { writer }) => {
				const providerId = modelElement.getAttribute('providerId');
				const pageIdentifier = modelElement.getAttribute('pageIdentifier');
				const frameId = crypto.randomUUID();

				const wrapper = writer.createContainerElement('span', {
					class: 'my-wiki-page-link-widget',
				});

				const raw = writer.createRawElement(
					'turbo-frame',
					{
						id: frameId,
						src: this.macroUrl(providerId, pageIdentifier, frameId),
						'data-provider-id': providerId,
						'data-page-identifier': pageIdentifier,
						'data-type': 'wiki-page-link',
					},
					() => { },
				);

				writer.insert(writer.createPositionAt(wrapper, 0), raw);
				return toWidget(wrapper, writer, { label: `[[[${providerId}:${pageIdentifier}]]]` });
			}
		});
	}

	macroUrl(providerId, pageIdentifier, frameId) {
		return getOPPath(this.editor).wikiPageLinkMacro(providerId, pageIdentifier, frameId)
	}
}
