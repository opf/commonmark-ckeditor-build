import BalloonEditorBase from '@ckeditor/ckeditor5-editor-balloon/src/ballooneditor';
import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import EssentialsPlugin from '@ckeditor/ckeditor5-essentials/src/essentials';
import UploadadapterPlugin from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import AutoformatPlugin from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import BoldPlugin from '@ckeditor/ckeditor5-basic-styles/src/bold';
import CodePlugin from '@ckeditor/ckeditor5-basic-styles/src/code';
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
import CommonMark from '@ckeditor/ckeditor5-markdown-gfm/src/commonmark';
import OpUploadPlugin from './plugins/op-upload-plugin';
import OPMacroTocPlugin from './plugins/op-macro-toc-plugin';
import OPMacroEmbeddedTable from './plugins/op-macro-embedded-table/embedded-table-plugin';
import OPMacroWpButtonPlugin from './plugins/op-macro-wp-button/op-macro-wp-button-plugin';
import OPWikiIncludePagePlugin from './plugins/op-macro-wiki-include/op-macro-wiki-include-plugin';
import OPLinkingWpPlugin from './plugins/op-linking-wp-plugin';
import {AtJsPlugin} from './plugins/op-atjs-plugin/atjs-plugin';
import OPMentioningPlugin from './plugins/op-mentioning-plugin';
import OPHelpLinkPlugin from './plugins/op-help-link-plugin/op-help-link-plugin';


export class BalloonEditor extends BalloonEditorBase {}
export class ClassicEditor extends ClassicEditorBase {}

// Export the two common interfaces
window.OPBalloonEditor = BalloonEditor;
window.OPClassicEditor = ClassicEditor;

const config = {
	plugins: [
		EssentialsPlugin,
		UploadadapterPlugin,
		AutoformatPlugin,
		BoldPlugin,
		CodePlugin,
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

		OPHelpLinkPlugin,
		OPMacroTocPlugin,
		OPMacroEmbeddedTable,
		OPMacroWpButtonPlugin,
		OPWikiIncludePagePlugin,

		AtJsPlugin,
		OPLinkingWpPlugin,
		OPMentioningPlugin,

		CommonMark,
		Table,
		TableToolbar,
		OpUploadPlugin
	],
	config: {
		heading: {
            options: [
                { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
                { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
                { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' }
            ]
        },
		toolbar: {
			items: [
				'heading',
				'|',
				'bold',
				'italic',
				'code',
				'link',
				'bulletedList',
				'numberedList',
				'imageUpload',
				'blockQuote',
				'|',
				'insertTable',
				'|',
				'insertToc',
				'insertWorkPackageButton',
				'insertEmbeddedTable',
				'insertWikiPageInclude',
				'|',
				'undo',
				'redo',
				'openProjectShowFormattingHelp'
			]
		},
		opEmbeddedTable: {
			toolbar: [
				'opEditEmbeddedTableQuery',
			]
		},
		OPMacroWpButton: {
			toolbar: [
				'opEditWpMacroButton',
			]
		},
		OPWikiIncludePage: {
			toolbar: [
				'opEditWikiIncludeMacroButton',
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
			toolbar: [ 'tableColumn', 'tableRow' ]
		},
		language: 'en'
	}
};

ClassicEditor.build = config;
BalloonEditor.build = config;
