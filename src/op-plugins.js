import OPMacroTocPlugin from './plugins/op-macro-toc-plugin';
import OPMacroEmbeddedTable from './plugins/op-macro-embedded-table/embedded-table-plugin';
import OPMacroWpButtonPlugin from './plugins/op-macro-wp-button/op-macro-wp-button-plugin';
import OpUploadPlugin from './plugins/op-upload-plugin';
import OPChildPagesPlugin from "./plugins/op-macro-child-pages/op-macro-child-pages-plugin";
import { Essentials } from '@ckeditor/ckeditor5-essentials';
import { UploadAdapter } from '@ckeditor/ckeditor5-adapter-ckfinder';
import { Autoformat } from '@ckeditor/ckeditor5-autoformat';
import { Bold } from '@ckeditor/ckeditor5-basic-styles';
import { Code } from '@ckeditor/ckeditor5-basic-styles';
import { Strikethrough } from '@ckeditor/ckeditor5-basic-styles'
import { Italic } from '@ckeditor/ckeditor5-basic-styles';
import { BlockQuote } from '@ckeditor/ckeditor5-block-quote';
import { Heading } from '@ckeditor/ckeditor5-heading';
import { ImageCaption } from '@ckeditor/ckeditor5-image';
import { ImageStyle } from '@ckeditor/ckeditor5-image';
import { ImageToolbar } from '@ckeditor/ckeditor5-image';
import { Link } from '@ckeditor/ckeditor5-link';
import { List } from '@ckeditor/ckeditor5-list';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { Typing } from '@ckeditor/ckeditor5-typing';
import OPHelpLinkPlugin from "./plugins/op-help-link-plugin/op-help-link-plugin";
import CodeBlockPlugin from "./plugins/code-block/code-block";
import OPPreviewPlugin from "./plugins/op-preview.plugin";
import { Table } from '@ckeditor/ckeditor5-table';
import { TableToolbar } from '@ckeditor/ckeditor5-table';
import { TableProperties } from '@ckeditor/ckeditor5-table';
import { TableCellProperties } from '@ckeditor/ckeditor5-table';
import { PasteFromOffice } from '@ckeditor/ckeditor5-paste-from-office';
import { TodoList } from '@ckeditor/ckeditor5-list';
import OPMacroListPlugin from "./plugins/op-macro-list-plugin";
import OPAttachmentListenerPlugin from './plugins/op-attachment-listener-plugin';
import OpImageAttachmentLookup from './plugins/op-image-attachment-lookup/op-image-attachment-lookup-plugin';
import CommonMark from './commonmark/commonmark';
import OPSourceCodePlugin from './plugins/op-source-code.plugin';
// import Mention from "../forked/ckeditor5-mention/src/mention";
import { Mention } from '@ckeditor/ckeditor5-mention';
import {MentionCaster} from './mentions/mentions-caster';
import { ImageResize } from '@ckeditor/ckeditor5-image';
import OpCustomCssClassesPlugin from "./plugins/op-custom-css-classes-plugin";
import { ImageBlock } from '@ckeditor/ckeditor5-image';
import { ImageInline } from '@ckeditor/ckeditor5-image';

// We divide our plugins into separate concerns here
// in order to enable / disable each group by configuration
export const opMacroPlugins = [
	OPMacroTocPlugin,
	OPMacroEmbeddedTable,
	OPMacroWpButtonPlugin,
	OPChildPagesPlugin,
];

export const opImageUploadPlugins = [
	OpUploadPlugin,
	OPAttachmentListenerPlugin
];

export const builtinPlugins = [
	Essentials,
	UploadAdapter,
	Autoformat,
	Bold,
	Code,
	Italic,
	Strikethrough,
	BlockQuote,
	Heading,
	ImageBlock,
	ImageInline,
	ImageCaption,
	ImageStyle,
	ImageResize,
	ImageToolbar,
	OpImageAttachmentLookup,
	Link,
	List,
	TodoList,
	Paragraph,
	Typing,

	// Built-in mentions
	Mention,
	MentionCaster,
	PasteFromOffice,

	OPHelpLinkPlugin,
	CodeBlockPlugin,
	OPPreviewPlugin,
	OPSourceCodePlugin,

	CommonMark,
	Table,
	TableToolbar,
	TableProperties,
	TableCellProperties,

	OPMacroListPlugin,

	OpCustomCssClassesPlugin,
].concat(
	// OpenProject Macro plugin group
	opMacroPlugins,

	// OpenProject image upload plugins
	opImageUploadPlugins,
);
