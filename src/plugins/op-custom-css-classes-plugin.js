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
			'alignment':'figure_align-'
		};
	};

	get alignmentValuesMap() {
		return {
			'left': 'start',
			'right': 'end',
			'center': 'center',
			'default': 'center',
		}
	};

	get alignmentClassPrefix() {
		return `${this.preFix}${this.attributesWithCustomClassesMap.alignment}`;
	}

	init() {
		this._addCustomCSSClassesToTheEditorContainer(this.editor);
		this._addCustomCSSClassesToElements(this.elementsWithCustomClassesMap, this.alignmentValuesMap);
		this._addCustomCSSClassesToAttributes(this.attributesWithCustomClassesMap, this.alignmentValuesMap);
	}

	_addCustomCSSClassesToTheEditorContainer(editor) {
		editor.sourceElement.parentElement.classList.add(`${this.preFix}container`);
	}

	_addCustomCSSClassesToElements(elementsWithCustomClassesMap, alignmentValuesMap) {
		const elementsWithCustomClasses = Object.keys(elementsWithCustomClassesMap);

		this.editor.model.schema.extend('table', { allowAttributes: [ 'figureClasses' ] } );

		this.editor.conversion.for('upcast').add(dispatcher => {
			dispatcher.on(`element:table`, (evt, data, conversionApi) => {
				const writer = conversionApi.writer;
				const viewItem = data.viewItem;
				const modelRange = data.modelRange;
				const modelElement = modelRange && modelRange.start.nodeAfter;

				if (!modelElement) {
					return;
				}

				// Get the parent figure element's classes and save them as the 'figureClasses' attribute of
				// this table model element. In the downcast we'll take this classes to place them again
				// in the figure that wraps the table. This is because the figure element doesn't exist in
				// the model but CkEditor wraps every table and image with a <figure>.
				let figureClasses = modelElement.getAttribute( 'figureClasses' ) || [];
				const parentFigureClasses = [...viewItem.parent.getClassNames()].filter(figureClass => !!figureClass);

				figureClasses = [...figureClasses, ...parentFigureClasses];

				const alignmentClass = parentFigureClasses.filter(figureClass => figureClass.startsWith(this.alignmentClassPrefix))[0];
				const alignmentAlias = alignmentClass && alignmentClass.replace(this.alignmentClassPrefix, '') || alignmentValuesMap.default;
				const alignmentToApply = Object.keys(alignmentValuesMap).find(alignmentKey => alignmentValuesMap[alignmentKey] === alignmentAlias);

				if (!alignmentClass) {
					const defaultAlignClass = `${this.alignmentClassPrefix}${alignmentAlias}`;
					figureClasses = [...figureClasses, defaultAlignClass];
				}

				writer.setAttribute('figureClasses', figureClasses, modelElement);


				if (alignmentToApply === 'center') {
					writer.setAttribute('alignment', null, modelElement);
				} else {
					writer.setAttribute('alignment', alignmentToApply, modelElement);
				}
			})
		}, {priority: 'high'});

		this.editor.conversion.for('downcast').add(dispatcher => {
			dispatcher.on(`insert`, (evt, data, conversionApi) => {
					const viewWriter = conversionApi.writer;
					const elementName = data.item.name;
					const modelElement = data.item;
					const viewElement = conversionApi.mapper.toViewElement(modelElement);
					let viewElements = [viewElement];
					// Images and tables are nested in a figure element, listItems are nested inside ul or ol
					// elements (only in the view, in the model are single elements).
					const isNestedElement = elementName === 'image' || elementName === 'table' || elementName === 'listItem';

					if (!elementsWithCustomClasses.includes(elementName) || !viewElement) {
						return;
					}

					if (isNestedElement) {
						if (elementName === 'listItem') {
							const listElement = viewElement.parent;
							viewElements = [...viewElements, listElement];
						} else {
							const figureViewElement = viewElement;
							const viewChildren = Array.from(conversionApi.writer.createRangeIn(viewElement).getItems());

							if (elementName === 'image') {
								const image = viewChildren.find(item => item.is('element', 'img'));
								viewElements = [...viewElements, image];
							}

							if (elementName === 'table') {
								const tableAlignment = modelElement.getAttribute('alignment');
								const childrenToAdd = viewChildren.filter(viewChild => elementsWithCustomClasses.includes(viewChild.name));

								if (!tableAlignment) {
									const defaultAlignClass = `${this.alignmentClassPrefix}${alignmentValuesMap.default}`;
									viewWriter.addClass(defaultAlignClass, figureViewElement);
								}

								viewElements = [...viewElements, ...childrenToAdd];
							}

							// Remove 'image' and 'table' classes. Styles will be handled by
							// custom classes (ie: op-uc-table)
							if (figureViewElement.hasClass(elementName)) {
								viewWriter.removeClass(elementName, figureViewElement);
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

	_addCustomCSSClassesToAttributes(attributesWithCustomClassesMap, alignmentValuesMap) {
		const attributesWithCustomClasses = Object.keys(attributesWithCustomClassesMap);

		this.editor.conversion.for('downcast').add(dispatcher => {
			dispatcher.on('attribute', (evt, data, conversionApi) => {
				const attributeName = data.attributeKey;
				const viewWriter = conversionApi.writer;
				const modelElement = data.item;

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
					const parentViewElement = conversionApi.mapper.toViewElement(modelElement.parent);
					const viewChildren = Array.from(conversionApi.writer.createRangeIn(parentViewElement).getItems());
					const codeElement = viewChildren.find(item => item.is('element', 'code'));

					viewWriter.addClass(`${this.preFix}${attributesWithCustomClassesMap[attributeName]}`, codeElement);
				}

				if (attributeName === 'alignment') {
					if (modelElement.name === 'table') {
						const figureViewElement = conversionApi.mapper.toViewElement(modelElement);
						// When the selected align is 'center', data.attributeNewValue is null
						const alignmentToApply = alignmentValuesMap[data.attributeNewValue || alignmentValuesMap.default];
						const alignmentClasses = Object
													.values(alignmentValuesMap)
													.map(alignmentValue => `${this.preFix}${attributesWithCustomClassesMap[attributeName]}${alignmentValue}`);

						alignmentClasses
							.filter(alignmentClass => figureViewElement.hasClass(alignmentClass))
							.forEach(alignmentClass => viewWriter.removeClass(alignmentClass, figureViewElement));

						// Remove inline alignment styles and classes, they will be handled by
						// custom classes (ie: op-uc-figure_align-center)
						if (figureViewElement.hasStyle('float')) {
							viewWriter.removeStyle('float', figureViewElement);
						}

						viewWriter.addClass(`${this.preFix}${attributesWithCustomClassesMap[attributeName]}${alignmentToApply}`, figureViewElement);
					}
				}
			}, { priority: 'low' });
		});
	}
}
