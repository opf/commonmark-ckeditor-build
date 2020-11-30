import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class OpCustomCssClassesPlugin extends Plugin {

	get config() {
		const preFix = 'op-uc-';
		const editorClasses = [`${preFix}container`, `${preFix}container_editing`];
		const elementsWithCustomClassesMap = {
			'paragraph': `${preFix}p`,
			'heading1': `${preFix}h1`,
			'heading2': `${preFix}h2`,
			'heading3': `${preFix}h3`,
			'heading4': `${preFix}h4`,
			'heading5': `${preFix}h5`,
			'heading6': `${preFix}h6`,
			'blockQuote': `${preFix}blockquote`,
			'figure': `${preFix}figure`,
			'table': [`${preFix}table`, `${preFix}figure--content`],
			'thead': `${preFix}table--head`,
			'tr': `${preFix}table--row`,
			'td': `${preFix}table--cell`,
			'th': [`${preFix}table--cell`, `${preFix}table--cell_head`],
			'ol': `${preFix}list`,
			'ul': `${preFix}list`,
			'todo': `${preFix}list ${preFix}task-list`,
			// The list item's name in the view is 'li' while in the model is 'listItem'
			'listItem': `${preFix}list--item`,
			'li': `${preFix}list--item`,
			// The image's name in the view is 'img' while in the model is 'image'
			'image': [`${preFix}image`, `${preFix}figure--content`],
			'img': [`${preFix}image`, `${preFix}figure--content`],
			'codeblock': `${preFix}code-block`,
			'caption': `${preFix}figure--description`,
			'op-macro-embedded-table': `${preFix}placeholder`,
			'op-macro-wp-button': `${preFix}placeholder`,
			'op-macro-child-pages': `${preFix}placeholder`,
			'op-macro-toc': `${preFix}placeholder`,
		};
		const attributesWithCustomClassesMap = {
			'code': `${preFix}code`,
			'linkHref': `${preFix}link`,
			'alignment': `${preFix}figure_align-`,
			'todo': `${preFix}task-list`,
			'numbered': `${preFix}list`,
			'bulleted': `${preFix}list`,
			'listType': null,
			'headingColumns': null,
		};
		const alignmentValuesMap = {
			'left': 'start',
			'right': 'end',
			'center': 'center',
			'default': 'center',
		};

		return {
			preFix,
			editorClasses,
			elementsWithCustomClassesMap,
			attributesWithCustomClassesMap,
			alignmentValuesMap,
		}
	}

	init() {
		this._addCustomCSSClassesToTheEditorContainer(this.editor);
		this._addCustomCSSClassesToElements(this.config.elementsWithCustomClassesMap, this.config.attributesWithCustomClassesMap, this.config.alignmentValuesMap);
		this._addCustomCSSClassesToAttributes(this.config.elementsWithCustomClassesMap, this.config.attributesWithCustomClassesMap, this.config.alignmentValuesMap);
	}

	_addCustomCSSClassesToTheEditorContainer(editor) {
		editor.sourceElement.classList.add(...this.config.editorClasses);
	}

	_addCustomCSSClassesToElements(elementsWithCustomClassesMap, attributesWithCustomClassesMap, alignmentValuesMap) {
		const elementsWithCustomClasses = Object.keys(elementsWithCustomClassesMap);

		this.editor.model.schema.extend('table', { allowAttributes: [ 'figureClasses' ] });

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
				let figureClasses = modelElement.getAttribute('figureClasses') || [];
				let parentFigureRawClasses = viewItem.parent.getClassNames && viewItem.parent.getClassNames();
				const parentFigureClasses = parentFigureRawClasses ? [...parentFigureRawClasses].filter(figureClass => !!figureClass) : [];

				figureClasses = [...figureClasses, ...parentFigureClasses];

				const alignmentClass = parentFigureClasses.filter(figureClass => figureClass.startsWith(attributesWithCustomClassesMap.alignment))[0];
				const alignmentAlias = alignmentClass && alignmentClass.replace(attributesWithCustomClassesMap.alignment, '') || alignmentValuesMap.default;
				const alignmentToApply = Object.keys(alignmentValuesMap).find(alignmentKey => alignmentValuesMap[alignmentKey] === alignmentAlias);

				if (!alignmentClass) {
					const defaultAlignClass = `${attributesWithCustomClassesMap.alignment}${alignmentAlias}`;
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
						viewElements = this._manageListItems(viewWriter, modelElement, viewElement, viewElements, elementsWithCustomClassesMap, attributesWithCustomClassesMap);
					} else {
						const figureViewElement = viewElement;
						const viewChildren = Array.from(viewWriter.createRangeIn(viewElement).getItems());

						if (elementName === 'image') {
							const image = viewChildren.find(item => item.is('element', 'img'));
							viewElements = [...viewElements, image];
						}

						if (elementName === 'table') {
							const tableAlignment = modelElement.getAttribute('alignment');
							const childrenToAdd = viewChildren.filter(viewChild => elementsWithCustomClasses.includes(viewChild.name));

							if (!tableAlignment) {
								const defaultAlignClass = `${attributesWithCustomClassesMap.alignment}${alignmentValuesMap.default}`;
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
					const elementClasses = elementsWithCustomClassesMap[elementKey];

					viewWriter.addClass(elementClasses, viewElement);
				});
			},
			{priority: 'low'});
		});
	}

	_addCustomCSSClassesToAttributes(elementsWithCustomClassesMap, attributesWithCustomClassesMap, alignmentValuesMap) {
		const attributesWithCustomClasses = Object.keys(attributesWithCustomClassesMap);

		this.editor.conversion.for('downcast').add(dispatcher => {
			dispatcher.on('attribute', (evt, data, conversionApi) => {
				const attributeName = data.attributeKey;
				const viewWriter = conversionApi.writer;
				const modelElement = data.item;

				if (!attributesWithCustomClasses.includes(attributeName)) {
					return;
				}

				if (attributeName === 'linkHref' || attributeName === 'code') {
					const attributeTag = attributeName === 'linkHref' ? 'a' : attributeName;
					const attributePriority = attributeName === 'linkHref' ? 5 : 10;
					const viewSelection = viewWriter.document.selection;
					const viewElement = viewWriter.createAttributeElement(
						attributeTag,
						{ class: attributesWithCustomClassesMap[attributeName] },
						{ priority: attributePriority }
					);

					if (modelElement.is('selection')) {
						viewWriter.wrap(viewSelection.getFirstRange(), viewElement);
					} else {
						viewWriter.wrap(conversionApi.mapper.toViewRange(data.range), viewElement);
					}
				} else if (attributeName === 'alignment') {
					if (modelElement.name === 'table') {
						const figureViewElement = conversionApi.mapper.toViewElement(modelElement);
						// When the selected align is 'center', data.attributeNewValue is null
						const alignmentToApply = alignmentValuesMap[data.attributeNewValue || alignmentValuesMap.default];
						const alignmentClasses = Object
													.values(alignmentValuesMap)
													.map(alignmentValue => `${attributesWithCustomClassesMap[attributeName]}${alignmentValue}`);

						alignmentClasses
							.filter(alignmentClass => figureViewElement.hasClass(alignmentClass))
							.forEach(alignmentClass => viewWriter.removeClass(alignmentClass, figureViewElement));

						// Remove inline alignment styles and classes, they will be handled by
						// custom classes (ie: op-uc-figure_align-center)
						if (figureViewElement.hasStyle('float')) {
							viewWriter.removeStyle('float', figureViewElement);
						}

						viewWriter.addClass(`${attributesWithCustomClassesMap[attributeName]}${alignmentToApply}`, figureViewElement);
					}
				} else if (attributeName === 'listType') {
					const viewElement = conversionApi.mapper.toViewElement(modelElement);
					const viewElements = this._manageListItems(viewWriter, modelElement, viewElement, [viewElement], elementsWithCustomClassesMap, attributesWithCustomClassesMap);

					viewElements.forEach(viewElement => {
						const elementKey = viewElement.name;
						const elementClasses = elementsWithCustomClassesMap[elementKey];

						viewWriter.addClass(elementClasses, viewElement);
					});
				} else if (attributeName === 'headingColumns') {
					const addHeadingColumns = data.attributeNewValue;
					const viewElement = conversionApi.mapper.toViewElement(modelElement);
					const viewChildren = Array.from(viewWriter.createRangeIn(viewElement).getItems());
					const viewElements = viewChildren.filter(viewChild => Object.keys(elementsWithCustomClassesMap).includes(viewChild.name));

					if (addHeadingColumns) {
						viewElements.forEach(viewElement => {
							const elementKey = viewElement.name;
							const elementClasses = elementsWithCustomClassesMap[elementKey];

							viewWriter.addClass(elementClasses, viewElement);
						});
					} else {
						viewElements
							.filter(viewElement => viewElement.hasClass(elementsWithCustomClassesMap.th[1]))
							.forEach(viewElement => {
								const nextSibling = viewElement.nextSibling;

								if (nextSibling && nextSibling.name !== 'th') {
									viewWriter.removeClass(elementsWithCustomClassesMap.th[1], viewElement);
								}
							});
					}
				}
			}, { priority: 'low' });
		});
	}

	_manageListItems(viewWriter, modelElement, viewElement, viewElements, elementsWithCustomClassesMap, attributesWithCustomClassesMap) {
		const listElement = viewElement.parent;
		const listType = modelElement.getAttribute('listType');
		const listTypeClass = attributesWithCustomClassesMap[listType];
		const previousElement = listElement.previousSibling;
		const nextElement = listElement.nextSibling;
		const previousListElement = previousElement &&
									previousElement.name === listElement.name &&
									previousElement.hasClass(listTypeClass) ?
										previousElement :
										null;
		const nextListElement = nextElement &&
								nextElement.name === listElement.name &&
								nextElement.hasClass(listTypeClass) ?
									nextElement :
									null;

		if (previousListElement) {
			viewWriter.mergeContainers(viewWriter.createPositionAfter(previousListElement));
		}

		if (nextListElement) {
			viewWriter.mergeContainers(viewWriter.createPositionBefore(nextListElement));
		}

		if (listType === 'todo') {
			viewWriter.addClass(listTypeClass, listElement);
			// Remove the regular lists classes (op-uc-list, op-uc-list--item) from todo lists if present
			// They could be present for example when the list type of the item has changed
			if (listElement.hasClass(elementsWithCustomClassesMap[listElement.name])) {
				viewWriter.removeClass(elementsWithCustomClassesMap[listElement.name], listElement);
			}

			if (viewElement.hasClass(elementsWithCustomClassesMap[viewElement.name])) {
				viewWriter.removeClass(elementsWithCustomClassesMap[viewElement.name], viewElement);
			}
		} else {
			// Remove the op-uc-task-list class if present.
			// It could be present for example when the list type has changed
			const todoListClass = attributesWithCustomClassesMap['todo'];

			if (listElement.hasClass(todoListClass)) {
				viewWriter.removeClass(todoListClass, listElement);
			}
		}

		return [...viewElements, listElement];
	}
}
