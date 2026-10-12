import { DecoupledEditor } from '@ckeditor/ckeditor5-editor-decoupled';
import {builtinPlugins} from './op-plugins';
import {defaultConfig} from "./op-ckeditor-config";
import {configurationCustomizer} from './op-config-customizer';

type CreateCustomized = ReturnType<typeof configurationCustomizer>;

export class ConstrainedEditor extends DecoupledEditor {
	declare static createCustomized: CreateCustomized;
}
export class FullEditor extends DecoupledEditor {
	declare static createCustomized: CreateCustomized;
}

// Export the two common interfaces
window.OPConstrainedEditor = ConstrainedEditor;
window.OPClassicEditor = FullEditor;

FullEditor.createCustomized = configurationCustomizer(FullEditor);
FullEditor.builtinPlugins = builtinPlugins;
FullEditor.defaultConfig = Object.assign({}, defaultConfig);
FullEditor.defaultConfig!.toolbar = {
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

ConstrainedEditor.createCustomized = configurationCustomizer(ConstrainedEditor);
ConstrainedEditor.builtinPlugins = builtinPlugins;
ConstrainedEditor.defaultConfig = Object.assign({}, defaultConfig);
ConstrainedEditor.defaultConfig!.toolbar = {
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
