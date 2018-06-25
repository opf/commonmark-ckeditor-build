import BalloonEditorBase from '@ckeditor/ckeditor5-editor-balloon/src/ballooneditor';
import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import EssentialsPlugin from '@ckeditor/ckeditor5-essentials/src/essentials';
import UploadadapterPlugin from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import AutoformatPlugin from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import BoldPlugin from '@ckeditor/ckeditor5-basic-styles/src/bold';
import ItalicPlugin from '@ckeditor/ckeditor5-basic-styles/src/italic';
import BlockquotePlugin from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import EasyimagePlugin from '@ckeditor/ckeditor5-easy-image/src/easyimage';
import HeadingPlugin from '@ckeditor/ckeditor5-heading/src/heading';
import ImagePlugin from '@ckeditor/ckeditor5-image/src/image';
import ImagecaptionPlugin from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImagestylePlugin from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImagetoolbarPlugin from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import LinkPlugin from '@ckeditor/ckeditor5-link/src/link';
import ListPlugin from '@ckeditor/ckeditor5-list/src/list';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import ParagraphPlugin from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import ImageuploadPlugin from '@ckeditor/ckeditor5-image/src/imageupload';
import GFMDataProcessor from '@ckeditor/ckeditor5-markdown-gfm/src/gfmdataprocessor';
import OpUploadPlugin from './plugins/op-upload-plugin';

export class BalloonEditor extends BalloonEditorBase {}
export class ClassicEditor extends ClassicEditorBase {}

// Export the two common interfaces
window.OPBalloonEditor = BalloonEditor;
window.OPClassicEditor = ClassicEditor;


// Simple plugin which loads the GFM processor.
function MarkdownGfmPlugin( editor ) {
	editor.data.processor = new GFMDataProcessor();
}

const config = {
	plugins: [
		EssentialsPlugin,
		UploadadapterPlugin,
		AutoformatPlugin,
		BoldPlugin,
		ItalicPlugin,
		BlockquotePlugin,
		EasyimagePlugin,
		HeadingPlugin,
		ImagePlugin,
		ImagecaptionPlugin,
		ImagestylePlugin,
		ImagetoolbarPlugin,
		ImageuploadPlugin,
		LinkPlugin,
		ListPlugin,
		ParagraphPlugin,

		MarkdownGfmPlugin,
		Table,
		TableToolbar,
		OpUploadPlugin
	],
	config: {
		toolbar: {
			items: [
				'heading',
				'|',
				'bold',
				'italic',
				'link',
				'bulletedList',
				'numberedList',
				'imageUpload',
				'blockQuote',
				'|',
				'insertTable',
				'|',
				'undo',
				'redo'
			]
		},
		image: {
			toolbar: [
				'imageStyle:full',
				'|',
				'imageTextAlternative'
			]
		},
		table: {
			toolbar: [ 'tableColumn', 'tableRow', 'mergeTableCells' ]
		},
		language: 'en'
	}
};

ClassicEditor.build = config;
BalloonEditor.build = config;
