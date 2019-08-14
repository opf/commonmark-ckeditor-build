import ClassicEditorBase from '@ckeditor/ckeditor5-editor-classic/src/classiceditor';
import {configurationCustomizer} from './op-config-customizer';
import {builtinPlugins} from './op-plugins';
import {defaultConfig} from "./op-ckeditor-config";

export class ConstrainedEditor extends ClassicEditorBase {}
export class FullEditor extends ClassicEditorBase {}

// Export the two common interfaces
window.OPConstrainedEditor = ConstrainedEditor;
window.OPClassicEditor = FullEditor;

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
