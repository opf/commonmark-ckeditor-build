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
				let $reference = jQuery(editor.ui.getEditableElement()).parent();
				let $previewWrapper = jQuery('<div class="ck-editor__preview op-uc-container"></div>');
				$reference.siblings('.ck-editor__preview').remove();

				const previewService = getOPService(editor, 'ckEditorPreview');
				unregisterPreview = previewService.render($previewWrapper[0], preview);

				$reference.hide();
				$reference.after($previewWrapper);

				disableItems(editor, view);
			};

			let getAndShowPreview = function() {
				let link = getOPPreviewContext(editor);
				let url = getOPPath(editor).api.v3.previewMarkup(link);

				jQuery
					.ajax({
						data: editor.getData(),
						url: url,
						response_type: 'text',
						contentType: 'text/plain; charset=UTF-8',
						method: 'POST',
					}).done(showPreview);
			};

			let disablePreviewing = function() {
				let $mainEditor = jQuery(editor.ui.getEditableElement()).parent();

				unregisterPreview();
				$mainEditor.siblings('.ck-editor__preview').remove();
				$mainEditor.show();

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
