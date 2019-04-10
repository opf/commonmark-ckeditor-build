// This SVG file import will be handled by webpack's raw-text loader.
// This means that imageIcon will hold the source SVG.
import sourceIcon from '../icons/source.svg';
import wysiwygIcon from '../icons/wysiwyg.svg';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {getOPPath, getOPPreviewContext, getOPService} from './op-context/op-context';
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


			let showSource = function(preview) {
				let $editable = jQuery(editor.ui.element);
				let $mainEditor = $editable.find('.ck-editor__main');
				let $reference;

				if ($mainEditor.length) {
					$reference = $mainEditor;
				} else {
					$reference = $editable;
				}

				let $sourceWrapper = jQuery('<div class="ck-editor__source"></div>');
				$reference.siblings('.ck-editor__source').remove();

				$reference.hide();
				$reference.after($sourceWrapper);

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
				let $editable = jQuery(editor.ui.element);
				let $mainEditor = $editable.find('.ck-editor__main');

				editor.fire('op:source-code-disabled');

				$mainEditor.siblings('.ck-editor__source').remove();
				$mainEditor.show();

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
