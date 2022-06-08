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
			'table': `${preFix}table`,
			'thead': `${preFix}table--head`,
			'tr': `${preFix}table--row`,
			'td': `${preFix}table--cell`,
			'th': [`${preFix}table--cell`, `${preFix}table--cell_head`],
			'tableCell': `${preFix}table--cell`,
			'tableRow': `${preFix}table--row`,
			'ol': `${preFix}list`,
			'ul': `${preFix}list`,
			'todo': `${preFix}list ${preFix}list_task-list`,
			// The list item's name in the view is 'li' while in the model is 'listItem'
			'listItem': `${preFix}list--item`,
			'li': `${preFix}list--item`,
			// The image's name in the view is 'img' while in the model is 'image'
			'imageInline': `${preFix}image ${preFix}image_inline`,
			'imageBlock': `${preFix}image`,
			'img': `${preFix}image`,
			'codeblock': `${preFix}code-block`,
			'caption': `${preFix}figure--description`,
			'op-macro-embedded-table': [`${preFix}placeholder`, `${preFix}embedded-table`],
			'op-macro-wp-button': [`${preFix}placeholder`, `${preFix}wp-button`],
			'op-macro-child-pages': [`${preFix}placeholder`, `${preFix}child-pages`],
			'op-macro-toc': [`${preFix}placeholder`, `${preFix}toc`],
			'content': `${preFix}figure--content`
		};
		const attributesWithCustomClassesMap = {
			'code': `${preFix}code`,
			'linkHref': `${preFix}link`,
			'alignment': `${preFix}figure_align-`,
			'tableAlignment': `${preFix}figure_align-`,
			'todo': `${preFix}list_task-list`,
			'numbered': `${preFix}list`,
			'bulleted': `${preFix}list`,
			'listType': null,
			'headingColumns': null,
			'width': null,
			'uploadStatus': null
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
		this._addCustomCSSClassesToElements(this.config);
		this._addCustomCSSClassesToAttributes(this.config);
	}

	_addCustomCSSClassesToTheEditorContainer(editor) {
		editor.sourceElement.classList.add(...this.config.editorClasses);
	}

	_addCustomCSSClassesToElements(config) {
		this.editor.model.schema.extend('table', {allowAttributes: [ 'figureClasses' ]});

		this.editor
				.conversion
				.for('upcast')
				.add(dispatcher => dispatcher.on(`element:table`, this._manageTableUpcast(config)), {priority: 'high'});

		this.editor
				.conversion
				.for('downcast')
				.add(dispatcher => dispatcher.on(`insert`, this._manageElementsInsertion(config), {priority: 'low'}));
	}

	_addCustomCSSClassesToAttributes(config) {
		this.editor
				.conversion
				.for('downcast')
				.add(dispatcher => dispatcher.on('attribute', this._manageAttributesInsertion(config), {priority: 'low'}));
	}

	_manageTableUpcast(config) {
		return (evt, data, conversionApi) => {
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

			const alignmentClass = parentFigureClasses.filter(figureClass => figureClass.startsWith(config.attributesWithCustomClassesMap.alignment))[0];
			const alignmentAlias = alignmentClass && alignmentClass.replace(config.attributesWithCustomClassesMap.alignment, '') || config.alignmentValuesMap.default;
			const alignmentToApply = Object.keys(config.alignmentValuesMap).find(alignmentKey => config.alignmentValuesMap[alignmentKey] === alignmentAlias);

			if (!alignmentClass) {
				const defaultAlignClass = `${config.attributesWithCustomClassesMap.alignment}${alignmentAlias}`;
				figureClasses = [...figureClasses, defaultAlignClass];
			}

			writer.setAttribute('figureClasses', figureClasses, modelElement);

			if (alignmentToApply === 'center') {
				writer.setAttribute('alignment', null, modelElement);
			} else {
				writer.setAttribute('alignment', alignmentToApply, modelElement);
			}
		}
	}

	_manageElementsInsertion(config) {
		return (evt, data, conversionApi) => {
			const elementsWithCustomClasses = Object.keys(config.elementsWithCustomClassesMap);
			const viewWriter = conversionApi.writer;
			const elementName = data.item.name;
			const modelElement = data.item;
			const viewElement = conversionApi.mapper.toViewElement(modelElement);
			let viewElements = [viewElement];
			// Images and tables are nested in a figure element, listItems are nested inside ul or ol
			// elements (only in the view, in the model are single elements).
			const nestedElements = ['imageBlock', 'table', 'tableCell', 'tableRow', 'listItem'];
			const isNestedElement = nestedElements.includes(elementName);

			if (!elementsWithCustomClasses.includes(elementName) || !viewElement) {
				return;
			}

			if (isNestedElement) {
				if (elementName === 'listItem') {
					viewElements = this._manageListItems(viewWriter, modelElement, viewElement, viewElements, config);
				} else {
					const figureViewElement = viewElement;
					const viewChildren = Array.from(viewWriter.createRangeIn(viewElement).getItems());

					if (elementName === 'imageBlock') {
						const image = viewChildren.find(item => item.is('element', 'img'));

						this._wrapInFigureContentContainer(image, figureViewElement, config, viewWriter);

						viewElements = [...viewElements, image];
					} else if (elementName === 'table' || elementName === 'tableRow') {
						const childrenToAdd = viewChildren.filter(viewChild => elementsWithCustomClasses.includes(viewChild.name));

						viewElements = [...viewElements, ...childrenToAdd];

						if (elementName === 'table') {
							const tableAlignment = modelElement.getAttribute('tableAlignment');

							if (!tableAlignment) {
								const defaultAlignClass = `${config.attributesWithCustomClassesMap.alignment}${config.alignmentValuesMap.default}`;

								viewWriter.addClass(defaultAlignClass, figureViewElement);
							}
						}
					}
				}
			}

			viewElements.forEach(viewElement => {
				const elementKey = isNestedElement ? viewElement.name : elementName;
				const elementClasses = config.elementsWithCustomClassesMap[elementKey];

				viewWriter.addClass(elementClasses, viewElement);
			});
		}
	}

	_manageAttributesInsertion(config) {
		return (evt, data, conversionApi) => {
			const attributesWithCustomClasses = Object.keys(config.attributesWithCustomClassesMap);
			const attributeName = data.attributeKey;
			const viewWriter = conversionApi.writer;
			const modelElement = data.item;
			const viewElement = conversionApi.mapper.toViewElement(modelElement);

			if (!attributesWithCustomClasses.includes(attributeName)) {
				return;
			}

			if (attributeName === 'linkHref' || attributeName === 'code') {
				const attributeTag = attributeName === 'linkHref' ? 'a' : attributeName;
				const attributePriority = attributeName === 'linkHref' ? 5 : 10;
				const viewSelection = viewWriter.document.selection;
				const viewElement = viewWriter.createAttributeElement(
					attributeTag,
					{class: config.attributesWithCustomClassesMap[attributeName]},
					{priority: attributePriority}
				);

				if (modelElement.is('selection')) {
					viewWriter.wrap(viewSelection.getFirstRange(), viewElement);
				} else {
					viewWriter.wrap(conversionApi.mapper.toViewRange(data.range), viewElement);
				}
			} else if (attributeName === 'tableAlignment') {
				const figureViewElement = viewElement;
				// When the selected align is 'center', data.attributeNewValue is null
				const alignmentToApply = config.alignmentValuesMap[data.attributeNewValue || config.alignmentValuesMap.default];
				const alignmentClasses = Object
					.values(config.alignmentValuesMap)
					.map(alignmentValue => `${config.attributesWithCustomClassesMap[attributeName]}${alignmentValue}`);

				alignmentClasses
					.filter(alignmentClass => figureViewElement.hasClass(alignmentClass))
					.forEach(alignmentClass => viewWriter.removeClass(alignmentClass, figureViewElement));

				// Remove inline alignment styles and classes, they will be handled by
				// custom classes (ie: op-uc-figure_align-center)
				if (figureViewElement.hasStyle('float')) {
					viewWriter.removeStyle('float', figureViewElement);
				}

				viewWriter.addClass(`${config.attributesWithCustomClassesMap[attributeName]}${alignmentToApply}`, figureViewElement);
			} else if (attributeName === 'listType') {
				const viewElements = this._manageListItems(viewWriter, modelElement, viewElement, [viewElement], config);

				viewElements.forEach(viewElement => {
					const elementKey = viewElement.name;
					const elementClasses = config.elementsWithCustomClassesMap[elementKey];

					viewWriter.addClass(elementClasses, viewElement);
				});
			} else if (attributeName === 'headingColumns') {
				const addHeadingColumns = data.attributeNewValue;
				const viewChildren = Array.from(viewWriter.createRangeIn(viewElement).getItems());
				const viewElements = viewChildren.filter(viewChild => Object.keys(config.elementsWithCustomClassesMap).includes(viewChild.name));

				if (addHeadingColumns) {
					viewElements.forEach(viewElement => {
						const elementKey = viewElement.name;
						const elementClasses = config.elementsWithCustomClassesMap[elementKey];

						viewWriter.addClass(elementClasses, viewElement);
					});
				} else {
					viewElements
						.filter(viewElement => viewElement.hasClass(config.elementsWithCustomClassesMap.th[1]))
						.forEach(viewElement => {
							const nextSibling = viewElement.nextSibling;

							if (nextSibling && nextSibling.name !== 'th') {
								viewWriter.removeClass(config.elementsWithCustomClassesMap.th[1], viewElement);
							}
						});
				}
			} else if (attributeName === 'width') {
				if (viewElement.hasClass('image_resized')) {
					viewWriter.removeClass('image_resized', viewElement);
				}
			} else if (attributeName === 'uploadStatus') {
				if (data.attributeNewValue === 'complete') {
					const viewChildren = Array.from(viewWriter.createRangeIn(viewElement).getItems());
					let placeholderElement = viewChildren.find(viewChild => viewChild.hasClass('ck-upload-placeholder-loader'));

					if (placeholderElement) {
						viewWriter.remove(viewWriter.createRangeOn(placeholderElement));
					}
				}
			}
		}
	}

	_manageListItems(viewWriter, modelElement, viewElement, viewElements, config) {
		const listElement = viewElement.parent;
		const listType = modelElement.getAttribute('listType');
		const listTypeClass = config.attributesWithCustomClassesMap[listType];
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
		} else {
			// Remove the op-uc-list_task-list class if present.
			// It could be present for example when the list type has changed
			const todoListClass = config.attributesWithCustomClassesMap['todo'];

			if (listElement.hasClass(todoListClass)) {
				viewWriter.removeClass(todoListClass, listElement);
			}
		}

		return [...viewElements, listElement];
	}

	_wrapInFigureContentContainer(element, parentElement, config, viewWriter) {
		const containerElement = viewWriter.createContainerElement(
			'div',
			{class: config.elementsWithCustomClassesMap.content}
		);

		viewWriter.insert(viewWriter.createPositionAt(containerElement, 0), element);
		viewWriter.insert(viewWriter.createPositionAt(parentElement, 0), containerElement);
	}
}
