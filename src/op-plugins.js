import OPMacroTocPlugin from './plugins/op-macro-toc-plugin';
import OPMacroEmbeddedTable from './plugins/op-macro-embedded-table/embedded-table-plugin';
import OPMacroWpButtonPlugin from './plugins/op-macro-wp-button/op-macro-wp-button-plugin';
import OpUploadPlugin from './plugins/op-upload-plugin';
import OPChildPagesPlugin from "./plugins/op-macro-child-pages/op-macro-child-pages-plugin";
import Essentials from "@ckeditor/ckeditor5-essentials/src/essentials";
import UploadAdapter from "@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter";
import AutoFormat from "@ckeditor/ckeditor5-autoformat/src/autoformat";
import Bold from "@ckeditor/ckeditor5-basic-styles/src/bold";
import Code from "@ckeditor/ckeditor5-basic-styles/src/code";
import Strikethrough from "@ckeditor/ckeditor5-basic-styles/src/strikethrough"
import Italic from "@ckeditor/ckeditor5-basic-styles/src/italic";
import BlockQuote from "@ckeditor/ckeditor5-block-quote/src/blockquote";
import Heading from "@ckeditor/ckeditor5-heading/src/heading";
import Image from "@ckeditor/ckeditor5-image/src/image";
import ImageCaption from "@ckeditor/ckeditor5-image/src/imagecaption";
import ImageStyle from "@ckeditor/ckeditor5-image/src/imagestyle";
import ImageToolbar from "@ckeditor/ckeditor5-image/src/imagetoolbar";
import Link from "@ckeditor/ckeditor5-link/src/link";
import List from "@ckeditor/ckeditor5-list/src/list";
import Paragraph from "@ckeditor/ckeditor5-paragraph/src/paragraph";
import Typing from "@ckeditor/ckeditor5-typing/src/typing";
import OPHelpLinkPlugin from "./plugins/op-help-link-plugin/op-help-link-plugin";
import CodeBlockPlugin from "./plugins/code-block/code-block";
import OPPreviewPlugin from "./plugins/op-preview.plugin";
import Table from "@ckeditor/ckeditor5-table/src/table";
import TableToolbar from "@ckeditor/ckeditor5-table/src/tabletoolbar";
import PasteFromOffice from '@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice';
import TodoList from "@ckeditor/ckeditor5-list/src/todolist";
import OPMacroListPlugin from "./plugins/op-macro-list-plugin";
import OPAttachmentListenerPlugin from './plugins/op-attachment-listener-plugin';
import OpImageAttachmentLookup from './plugins/op-image-attachment-lookup/op-image-attachment-lookup-plugin';
import CommonMark from './commonmark/commonmark';
import OPSourceCodePlugin from './plugins/op-source-code.plugin';
import Mention from "../forked/ckeditor5-mention/src/mention";
import {MentionCaster} from './mentions/mentions-caster';

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
	AutoFormat,
	Bold,
	Code,
	Italic,
	Strikethrough,
	BlockQuote,
	Heading,
	Image,
	ImageCaption,
	ImageStyle,
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

	OPMacroListPlugin,

].concat(
	// OpenProject Macro plugin group
	opMacroPlugins,

	// OpenProject image upload plugins
	opImageUploadPlugins,
);
