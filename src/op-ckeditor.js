import BalloonEditorBase from '@ckeditor/ckeditor5-editor-balloon/src/ballooneditor';
import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import Essentials from '@ckeditor/ckeditor5-essentials/src/essentials';
import UploadAdapter from '@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter';
import AutoFormat from '@ckeditor/ckeditor5-autoformat/src/autoformat';
import Bold from '@ckeditor/ckeditor5-basic-styles/src/bold';
import Code from '@ckeditor/ckeditor5-basic-styles/src/code';
import Italic from '@ckeditor/ckeditor5-basic-styles/src/italic';
import BlockQuote from '@ckeditor/ckeditor5-block-quote/src/blockquote';
import Heading from '@ckeditor/ckeditor5-heading/src/heading';
import Image from '@ckeditor/ckeditor5-image/src/image';
import ImageCaption from '@ckeditor/ckeditor5-image/src/imagecaption';
import ImageStyle from '@ckeditor/ckeditor5-image/src/imagestyle';
import ImageToolbar from '@ckeditor/ckeditor5-image/src/imagetoolbar';
import Link from '@ckeditor/ckeditor5-link/src/link';
import List from '@ckeditor/ckeditor5-list/src/list';
import Table from '@ckeditor/ckeditor5-table/src/table';
import TableToolbar from '@ckeditor/ckeditor5-table/src/tabletoolbar';
import Paragraph from '@ckeditor/ckeditor5-paragraph/src/paragraph';
import CommonMark from '@ckeditor/ckeditor5-markdown-gfm/src/commonmark';
import OPHelpLinkPlugin from './plugins/op-help-link-plugin/op-help-link-plugin';
import Typing from '@ckeditor/ckeditor5-typing/src/typing';
import CodeBlockPlugin from './plugins/code-block/code-block';
import OPPreviewPlugin from './plugins/op-preview.plugin';
import {configurationCustomizer} from './op-config-customizer';
import {opMacroPlugins, opMentioningPlugins, opImageUploadPlugins} from './op-plugins';
import {BalloonEditor} from './op-ckeditor';
import OPMacroListPlugin from "./plugins/op-macro-list-plugin";

export class BalloonEditor extends BalloonEditorBase {}
export class ClassicEditor extends ClassicEditorBase {}

// Export the two common interfaces
window.OPBalloonEditor = BalloonEditor;
window.OPClassicEditor = ClassicEditor;

const builtinPlugins = [
	Essentials,
	UploadAdapter,
	AutoFormat,
	Bold,
	Code,
	Italic,
	BlockQuote,
	Heading,
	Image,
	ImageCaption,
	ImageStyle,
	ImageToolbar,
	Link,
	List,
	Paragraph,
	Typing,

	OPHelpLinkPlugin,
	CodeBlockPlugin,
	OPPreviewPlugin,

	CommonMark,
	Table,
	TableToolbar,

	OPMacroListPlugin,

	].concat(
	// OpenProject Macro plugin group
	opMacroPlugins,

	// OpenProject mentioning plugins
	opMentioningPlugins,

	// OpenProject image upload plugins
	opImageUploadPlugins,
)
const defaultConfig = {
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
			'insertCodeBlock',
			'link',
			'bulletedList',
			'numberedList',
			'imageUpload',
			'blockQuote',
			'|',
			'insertTable',
			'|',
			'macroList',
			'|',
			'undo',
			'redo',
			'openProjectShowFormattingHelp',
			'|',
			'preview'
		]
	},
	OPMacroEmbeddedTable: {
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
	OPCodeBlock: {
		toolbar: [
			'opEditCodeBlock',
		]
	},
	OPChildPages: {
		toolbar: [
			'opEditChildPagesMacroButton',
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
};

ClassicEditor.builtinPlugins = builtinPlugins;
BalloonEditor.builtinPlugins = builtinPlugins;
ClassicEditor.defaultConfig = defaultConfig;
BalloonEditor.defaultConfig = defaultConfig;

ClassicEditor.createCustomized = configurationCustomizer(ClassicEditor);
BalloonEditor.createCustomized = configurationCustomizer(BalloonEditor);
