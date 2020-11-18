import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class OpCustomCssClassesPlugin extends Plugin {
	get preFix() {
		return 'op-uc-';
	}

	get elementsWithCustomClassesMap() {
		return {
			'paragraph': 'p',
			'heading1': 'h1',
			'heading2': 'h2',
			'heading3': 'h3',
			'heading4': 'h4',
			'heading5': 'h5',
			'heading6': 'h6',
			'blockQuote': 'blockquote',
			'figure': 'figure',
			'table': ['table', 'figure--content'],
			'tr': 'table--row',
			'td': 'table--cell',
			'th': ['table--cell', 'table--cell_head'],
			'ol': 'list',
			'ul': 'list',
			// The list item's name in the view is 'li' while in the model is 'listItem'
			'listItem': 'list--item',
			'li': 'list--item',
			// The image's name in the view is 'img' while in the model is 'image'
			'image': ['image', 'figure--content'],
			'img': ['image', 'figure--content'],
			'codeblock': 'code-block',
			'caption': 'figure--description',
			'op-macro-embedded-table': 'placeholder',
			'op-macro-wp-button': 'placeholder',
			'op-macro-child-pages': 'placeholder',
			'op-macro-toc': 'placeholder',
		};
	};

	get attributesWithCustomClassesMap() {
		return {
			'code': 'code',
			'linkHref': 'link',
		};
	};

	init() {
		this._addCustomCSSClassesToTheEditorContainer(this.editor);
		this._addCustomCSSClassesToElements(this.elementsWithCustomClassesMap);
		this._addCustomCSSClassesToAttributes(this.attributesWithCustomClassesMap);
	}

	_addCustomCSSClassesToTheEditorContainer(editor) {
		editor.sourceElement.parentElement.classList.add(`${this.preFix}container`);
	}

	_addCustomCSSClassesToElements(elementsWithCustomClassesMap) {
		const elementsWithCustomClasses = Object.keys(elementsWithCustomClassesMap);

		this.editor.conversion.for('editingDowncast').add(dispatcher => {
			dispatcher.on(`insert`, (evt, data, conversionApi) => {
					const elementName = data.item.name;
					const viewWriter = conversionApi.writer;
					const modelElement = data.item;
					const viewElement = conversionApi.mapper.toViewElement(modelElement);
					let viewElements = [viewElement];
					// Images and tables are nested in a figure element, listItems are
					// nested inside ul or ol elements (only in the view, in the model are
					// single elements).
					const isNestedElement = elementName === 'image' || elementName === 'table' || elementName === 'listItem';

					if (!elementsWithCustomClasses.includes(elementName) || !viewElement) {
						return;
					}

					if (isNestedElement) {
						if (elementName === 'listItem') {
							viewElements = [...viewElements, viewElement.parent];
						} else {
							const viewChildren = Array.from(conversionApi.writer.createRangeIn(viewElement).getItems());

							if (elementName === 'image') {
								const image = viewChildren.find(item => item.is('element', 'img'));
								viewElements = [...viewElements, image];
							}

							if (elementName === 'table') {
								const childrenToAdd = viewChildren.filter(viewChild => elementsWithCustomClasses.includes(viewChild.name));
								viewElements = [...viewElements, ...childrenToAdd];
							}
						}
					}

					viewElements.forEach(viewElement => {
						const elementKey = isNestedElement ? viewElement.name : elementName;
						let elementClasses = Array.isArray(elementsWithCustomClassesMap[elementKey]) ?
							elementsWithCustomClassesMap[elementKey].map(elementClass => `${this.preFix}${elementClass}`) :
							`${this.preFix}${elementsWithCustomClassesMap[elementKey]}`;

						viewWriter.addClass(elementClasses, viewElement);
					});
				},
				{priority: 'low'});
		});
	}

	_addCustomCSSClassesToAttributes(attributesWithCustomClassesMap) {
		const attributesWithCustomClasses = Object.keys(attributesWithCustomClassesMap);

		this.editor.conversion.for('editingDowncast').add(dispatcher => {
			dispatcher.on('attribute', (evt, data, conversionApi) => {
				const attributeName = data.attributeKey;
				const viewWriter = conversionApi.writer;

				if (!attributesWithCustomClasses.includes(attributeName)) {
					return;
				}

				if (attributeName === 'linkHref') {
					const viewElement = viewWriter.createAttributeElement(
						'a',
						{ class: `${this.preFix}${attributesWithCustomClassesMap[attributeName]}` },
						{ priority: 5 }
					);

					viewWriter.wrap(conversionApi.mapper.toViewRange(data.range), viewElement);
				}

				if (attributeName === 'code') {
					const modelElement = data.item;
					const parentViewElement = conversionApi.mapper.toViewElement(modelElement.parent);
					const viewChildren = Array.from(conversionApi.writer.createRangeIn(parentViewElement).getItems());
					const codeElement = viewChildren.find(item => item.is('element', 'code'));

					viewWriter.addClass(`${this.preFix}${attributesWithCustomClassesMap[attributeName]}`, codeElement);
				}
			}, { priority: 'low' });
		});
	}
}
