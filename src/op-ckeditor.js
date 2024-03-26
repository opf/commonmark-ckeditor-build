import { DecoupledEditor } from '@ckeditor/ckeditor5-editor-decoupled';
import { EditorWatchdog } from '@ckeditor/ckeditor5-watchdog';
import {builtinPlugins} from './op-plugins';
import {defaultConfig} from "./op-ckeditor-config";
import {configurationCustomizer} from './op-config-customizer';

export class ConstrainedEditor extends DecoupledEditor {}
export class FullEditor extends DecoupledEditor {}

// Export the two common interfaces
window.OPConstrainedEditor = ConstrainedEditor;
window.OPClassicEditor = FullEditor;

// Export the Watchdog feature
window.OPEditorWatchdog = EditorWatchdog;

FullEditor.createCustomized = configurationCustomizer(FullEditor);
FullEditor.builtinPlugins = builtinPlugins;
FullEditor.defaultConfig = Object.assign({}, defaultConfig);
FullEditor.defaultConfig.toolbar = {
		items: [
			'heading',
			'|',
			'bold',
			'italic',
			'strikethrough',
			'code',
			'insertCodeBlock',
			'mermaid',
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
			'undo',
			'redo',
			'openProjectShowFormattingHelp',
			'|',
			'preview',
			'opShowSource'
		]
};

ConstrainedEditor.createCustomized = configurationCustomizer(ConstrainedEditor);
ConstrainedEditor.builtinPlugins = builtinPlugins;
ConstrainedEditor.defaultConfig = Object.assign({}, defaultConfig);
ConstrainedEditor.defaultConfig.toolbar = {
	items: [
		'bold',
		'italic',
		'strikethrough',
		'code',
		'insertCodeBlock',
		'mermaid',
		'link',
		'bulletedList',
		'numberedList',
		'todoList',
		'imageUpload',
		'blockQuote',
		'|',
		'openProjectShowFormattingHelp',
		'preview',
		'opShowSource'
	]
};
