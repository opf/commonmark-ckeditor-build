// This SVG file import will be handled by webpack's raw-text loader.
// This means that imageIcon will hold the source SVG.
import imageIcon from '../icons/preview.svg';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import FileDialogButtonView from '@ckeditor/ckeditor5-upload/src/ui/filedialogbuttonview';
import {getOPPath, getOPPreviewContext, getOPService} from './op-context/op-context';

export default class OPPreviewPlugin extends Plugin {

	static get pluginName() {
		return 'OPPreview';
	}

	init() {
		const editor = this.editor;
		let previewing = false;
		let unregisterPreview = null;
		let currentlyDisabled = [];

		editor.ui.componentFactory.add( 'preview', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: this.label,
				icon: imageIcon,
				tooltip: true,
			} );

			let toolbarItems = function() {
				if (!editor.ui.view.toolbar) {
					return [];
				}

				return editor.ui.view.toolbar.items._items;
			};

			let disableItems = function() {
				jQuery.each(toolbarItems(), function(index, item) {
					let toDisable = item;

					if (item instanceof FileDialogButtonView) {
						toDisable = item.buttonView;
					} else if (item === view || !item.hasOwnProperty('isEnabled')) {
						toDisable = null;
					}

					if (!toDisable) {
						// do nothing
					} else if (toDisable.isEnabled) {
						toDisable.isEnabled = false;
					} else {
						currentlyDisabled.push(toDisable);
					}
				});
			};

			let enableItems = function() {
				jQuery.each(toolbarItems(), function(index, item) {
					let toEnable = item;

					if (item instanceof FileDialogButtonView) {
						toEnable = item.buttonView;
					}

					if (currentlyDisabled.indexOf(toEnable) < 0) {
						toEnable.isEnabled = true
					}
				});

				currentlyDisabled.length = 0;
			};

			let showPreview = function(preview) {
				let $editable = jQuery(editor.element);
				let $mainEditor = $editable.find('.ck-editor__main');
				let $reference;

				if ($mainEditor.length) {
					$reference = $mainEditor;
				} else {
					$reference = $editable;
				}

				let $previewWrapper = jQuery('<div class="ck-editor__preview"></div>');
				$reference.siblings('.ck-editor__preview').remove();

				const previewService = getOPService(editor, 'ckEditorPreview');
				unregisterPreview = previewService.render($previewWrapper[0], preview);

				$reference.hide();
				$reference.after($previewWrapper);

				disableItems();
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
				let $editable = jQuery(editor.element);
				let $mainEditor = $editable.find('.ck-editor__main');

				unregisterPreview();
				$mainEditor.siblings('.ck-editor__preview').remove();
				$mainEditor.show();

				enableItems();
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
