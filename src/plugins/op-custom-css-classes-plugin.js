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
			'listItem': 'list--item',
			'blockQuote': 'blockquote',
			'figure': 'figure',
			'table': ['table', 'figure--content'],
			'tr': 'table--row',
			'td': 'table--cell',
			'th': ['table--cell', 'table--cell_head'],
			// The Image name in the view is 'img' while in the model's is 'image'
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
		this._addCustomCSSClassesToElements(this.elementsWithCustomClassesMap);
		this._addCustomCSSClassesToAttributes(this.attributesWithCustomClassesMap);
	}

	_addCustomCSSClassesToElements(elementsWithCustomClassesMap) {
		const elementsWithCustomClasses = Object.keys(elementsWithCustomClassesMap);

		this.editor.conversion.for( 'editingDowncast' ).add(dispatcher => {
			dispatcher.on(`insert`, (evt, data, conversionApi) => {
					const elementName = data.item.name;
					const viewWriter = conversionApi.writer;
					const modelElement = data.item;
					const viewElement = conversionApi.mapper.toViewElement(modelElement);
					let viewElements = [viewElement];
					// Images and tables are nested in a figure element
					const isFigureElement = elementName === 'image' || elementName === 'table';

					if (!elementsWithCustomClasses.includes(elementName) || !viewElement) {
						return;
					}

					if (isFigureElement) {
						const viewChildren = Array.from(conversionApi.writer.createRangeIn(viewElement).getItems());

						if (elementName === 'image') {
							const image = viewChildren.find(item => item.is('element', 'img'));
							viewElements = [...viewElements, image];
						}

						if (elementName === 'table') {
							viewChildren.forEach(viewChild => {
								if (elementsWithCustomClasses.includes(viewChild.name)) {
									viewElements = [...viewElements, viewChild];
								}
							})
						}
					}

					viewElements.forEach(viewElement => {
						const elementKey = isFigureElement ? viewElement.name : elementName;
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

		this.editor.conversion.for( 'editingDowncast' ).add( dispatcher => {
			dispatcher.on( 'attribute', ( evt, data, conversionApi ) => {
				const attributeName = data.attributeKey;
				const viewWriter = conversionApi.writer;

				if (!attributesWithCustomClasses.includes(attributeName)) {
					return;
				}

				if (attributeName === 'linkHref') {
					const viewElement = viewWriter.createAttributeElement( 'a', {
						class: `${this.preFix}${attributesWithCustomClassesMap[attributeName]}`,
					}, {
						priority: 5
					} );

					viewWriter.wrap( conversionApi.mapper.toViewRange( data.range ), viewElement );
				} else {
					const modelElement = data.item;
					let viewElement = conversionApi.mapper.toViewElement( modelElement );

					if ( !viewElement ) {
						return;
					}

					viewWriter.addClass( `${this.preFix}${attributesWithCustomClassesMap[attributeName]}`, viewElement);
				}
			}, { priority: 'low' } );
		} );
	}
}
