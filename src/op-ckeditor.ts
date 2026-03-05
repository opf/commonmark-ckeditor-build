import { DecoupledEditor } from '@ckeditor/ckeditor5-editor-decoupled';
import { EditorWatchdog } from '@ckeditor/ckeditor5-watchdog';
import {builtinPlugins} from './op-plugins';
import {defaultConfig} from "./op-ckeditor-config";
import {configurationCustomizer} from './op-config-customizer';
import type { Editor, EditorConfig } from '@ckeditor/ckeditor5-core';
import type { ICKEditorWatchdog } from './ckeditor-types';
import type { OpenProjectEditorConfig, OpenProjectEditorClass } from './op-config-customizer';
import type { OpenProjectPluginConstructor } from './op-plugins';
export type {
	CKEditorEvent,
	CKEditorListenOptions,
	CKEditorDomEventData,
	ICKEditorInstance,
	ICKEditorStatic,
	ICKEditorState,
	ICKEditorError,
	ICKEditorWatchdog,
	ICKEditorMentionType,
	ICKEditorContext
} from './ckeditor-types';

export class ConstrainedEditor extends DecoupledEditor {}
export class FullEditor extends DecoupledEditor {}

export const OPEditorWatchdog:ICKEditorWatchdog = EditorWatchdog;

type OpenProjectEditorDefaultConfig = EditorConfig & {
	toolbar?:{
		items?:string[];
	};
};

type OpenProjectEditorStatics = typeof DecoupledEditor & OpenProjectEditorClass & {
	createCustomized:(wrapper:string|HTMLElement, configuration:OpenProjectEditorConfig) => Promise<Editor>;
	builtinPlugins:OpenProjectPluginConstructor[];
	defaultConfig:OpenProjectEditorDefaultConfig;
};

// Export the two common interfaces
window.OPConstrainedEditor = ConstrainedEditor;
window.OPClassicEditor = FullEditor;

// Export the Watchdog feature
window.OPEditorWatchdog = OPEditorWatchdog;

const fullEditorClass = FullEditor as OpenProjectEditorStatics;
fullEditorClass.createCustomized = configurationCustomizer(fullEditorClass);
fullEditorClass.builtinPlugins = builtinPlugins;
fullEditorClass.defaultConfig = Object.assign({}, defaultConfig) as OpenProjectEditorDefaultConfig;
fullEditorClass.defaultConfig.toolbar = {
		items: [
			'heading',
			'|',
			'bold',
			'italic',
			'strikethrough',
			'code',
			'insertCodeBlock',
			'link',
			'bulletedList',
			'numberedList',
			'todoList',
			'imageUpload',
			'blockQuote',
			'|',
			'insertTable',
			'macroList',
			'|',
			'opContentRevisions',
			'undo',
			'redo',
			'openProjectShowFormattingHelp',
			'|',
			'pageBreak',
			'|',
			'preview',
			'opShowSource',
		]
};

const constrainedEditorClass = ConstrainedEditor as OpenProjectEditorStatics;
constrainedEditorClass.createCustomized = configurationCustomizer(constrainedEditorClass);
constrainedEditorClass.builtinPlugins = builtinPlugins;
constrainedEditorClass.defaultConfig = Object.assign({}, defaultConfig) as OpenProjectEditorDefaultConfig;
constrainedEditorClass.defaultConfig.toolbar = {
	items: [
		'bold',
		'italic',
		'strikethrough',
		'code',
		'insertCodeBlock',
		'link',
		'bulletedList',
		'numberedList',
		'todoList',
		'imageUpload',
		'blockQuote',
		'|',
		'opContentRevisions',
		'undo',
		'redo',
		'openProjectShowFormattingHelp',
		'preview',
		'opShowSource'
	]
};
