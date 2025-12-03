// This SVG file import will be handled by webpack's raw-text loader.
// This means that imageIcon will hold the source SVG.
import sourceIcon from '../icons/source.svg';
import wysiwygIcon from '../icons/wysiwyg.svg';

import { ButtonView } from '@ckeditor/ckeditor5-ui';

import { Plugin } from '@ckeditor/ckeditor5-core';
import {enableItems, disableItems} from '../helpers/button-disabler';

export default class OPSourceCodePlugin extends Plugin {

	static get pluginName() {
		return 'OPSourceCode';
	}

	init() {
		const editor = this.editor;
		let inSourceMode = false;
		let labels = {
			source: window.I18n.t('js.editor.mode.manual'),
			wysiwyg: window.I18n.t('js.editor.mode.wysiwyg'),
		}


		editor.ui.componentFactory.add( 'opShowSource', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: labels.source,
				class: '',
				icon: sourceIcon,
				tooltip: true,
			} );


			let showSource = function(_preview) {
				const editableElement = editor.ui.getEditableElement();
				const reference = editableElement?.parentElement;
				if (!reference?.parentElement) {
					console.error('Cannot show source: invalid editor structure');
					return;
				}

				const sourceWrapper = document.createElement('div');
				sourceWrapper.className = 'ck-editor__source';
				
				// Remove existing source elements (only direct siblings)
				const existingSources = Array.from(reference.parentElement.children)
					.filter(el => el !== reference && el.classList.contains('ck-editor__source'));
				existingSources.forEach(el => el.remove());

				reference.style.display = 'none';
				reference.parentElement.insertBefore(sourceWrapper, reference.nextSibling);

				disableItems(editor, view);

				editor.fire('op:source-code-enabled');

				view.set( {
					label: labels.wysiwyg,
					class: '-source-enabled',
					icon: wysiwygIcon,
					tooltip: true,
				} );

			};

			let hideSource = function() {
				const editableElement = editor.ui.getEditableElement();
				const mainEditor = editableElement?.parentElement;
				if (!mainEditor?.parentElement) {
					console.error('Cannot hide source: invalid editor structure');
					return;
				}

				editor.fire('op:source-code-disabled');

				// Remove existing source elements (only direct siblings)
				const existingSources = Array.from(mainEditor.parentElement.children)
					.filter(el => el !== mainEditor && el.classList.contains('ck-editor__source'));
				existingSources.forEach(el => el.remove());
				
				mainEditor.style.display = '';

				enableItems(editor);

				view.set( {
					label: labels.source,
					class: '',
					icon: sourceIcon,
					tooltip: true,
				} );
			};


			// Callback executed once the image is clicked.
			view.on('execute', () => {
				if (inSourceMode) {
					inSourceMode = false;
					hideSource();
				} else {
					inSourceMode = true;
					showSource();
				}
			});

			return view;
		} );
	}

}
