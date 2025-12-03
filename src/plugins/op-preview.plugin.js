// This SVG file import will be handled by webpack's raw-text loader.
// This means that imageIcon will hold the source SVG.
import imageIcon from '../icons/preview.svg';

import { ButtonView } from '@ckeditor/ckeditor5-ui';

import { Plugin } from '@ckeditor/ckeditor5-core';
import {getOPPath, getOPPreviewContext, getOPService} from './op-context/op-context';
import {enableItems, disableItems} from '../helpers/button-disabler';

export default class OPPreviewPlugin extends Plugin {

	static get pluginName() {
		return 'OPPreview';
	}

	init() {
		const editor = this.editor;
		let previewing = false;
		let unregisterPreview = null;

		editor.ui.componentFactory.add( 'preview', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: this.label,
				icon: imageIcon,
				tooltip: true,
			} );


			let showPreview = function(preview) {
				const editableElement = editor.ui.getEditableElement();
				const reference = editableElement.parentElement;
				const previewWrapper = document.createElement('div');
				previewWrapper.className = 'ck-editor__preview op-uc-container';
				
				// Remove existing preview elements (only direct siblings)
				const existingPreviews = Array.from(reference.parentElement.children)
					.filter(el => el !== reference && el.classList.contains('ck-editor__preview'));
				existingPreviews.forEach(el => el.remove());

				const previewService = getOPService(editor, 'ckEditorPreview');
				unregisterPreview = previewService.render(previewWrapper, preview);

				reference.style.display = 'none';
				reference.parentElement.insertBefore(previewWrapper, reference.nextSibling);

				disableItems(editor, view);
			};

			let getAndShowPreview = function() {
				let link = getOPPreviewContext(editor);
				let url = getOPPath(editor).api.v3.previewMarkup(link);

				fetch(url, {
					method: 'POST',
					headers: {
						'Content-Type': 'text/plain; charset=UTF-8'
					},
					body: editor.getData()
				})
					.then(response => {
						if (!response.ok) {
							throw new Error(`HTTP error! status: ${response.status}`);
						}
						return response.text();
					})
					.then(showPreview)
					.catch(error => {
						console.error('Error fetching preview:', error);
						previewing = false;
						enableItems(editor);
					});
			};

			let disablePreviewing = function() {
				const editableElement = editor.ui.getEditableElement();
				const mainEditor = editableElement.parentElement;

				if (unregisterPreview) {
					unregisterPreview();
				}
				
				// Remove existing preview elements (only direct siblings)
				const existingPreviews = Array.from(mainEditor.parentElement.children)
					.filter(el => el.classList.contains('ck-editor__preview'));
				existingPreviews.forEach(el => el.remove());
				
				mainEditor.style.display = '';

				enableItems(editor);
			};


			// Callback executed once the image is clicked.
			view.on('execute', () => {
				if (previewing) {
					previewing = false;

					disablePreviewing();
				} else {
					previewing = true;

					getAndShowPreview();
				}
			});

			return view;
		} );
	}

	get label() {
		return window.I18n.t('js.editor.preview');
	}
}
