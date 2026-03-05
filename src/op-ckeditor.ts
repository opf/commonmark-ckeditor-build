// @ts-nocheck
import { DecoupledEditor } from '@ckeditor/ckeditor5-editor-decoupled';
import { EditorWatchdog } from '@ckeditor/ckeditor5-watchdog';
import {builtinPlugins} from './op-plugins';
import {defaultConfig} from "./op-ckeditor-config";
import {configurationCustomizer} from './op-config-customizer';

export interface CKEditorEvent {
	stop:() => void;
}

export interface CKEditorListenOptions {
	priority?:string;
}

export interface CKEditorDomEventData {
	altKey:boolean;
	shiftKey:boolean;
	ctrlKey:boolean;
	metaKey:boolean;
	keyCode:number;
}

export interface ICKEditorInstance {
	id:string;
	state:string;
	getData(options?:{ trim:boolean }):string;
	setData(content:string):void;
	destroy():void;
	enableReadOnlyMode(lockId:string):void;
	disableReadOnlyMode(lockId:string):void;
	on(event:string, callback:() => unknown):void;
	listenTo(
		node:unknown,
		key:string,
		callback:(evt:CKEditorEvent, data:CKEditorDomEventData) => unknown,
		options?:CKEditorListenOptions
	):void;
	model:{
		on(ev:string, callback:() => unknown):void;
		fire(ev:string, data:unknown):void;
		document:{
			on(ev:string, callback:() => unknown):void;
		};
	};
	editing:{
		view:{
			focus():void;
			document:Document;
		};
	};
	config:any;
	ui:any;
	element:HTMLElement;
}

export interface ICKEditorStatic {
	create(el:HTMLElement, config?:any):Promise<ICKEditorInstance>;
	createCustomized(el:string|HTMLElement, config?:any):Promise<ICKEditorInstance>;
	builtinPlugins:unknown[];
	defaultConfig:any;
}

export type ICKEditorState =
	'initializing' | 'ready' | 'crashed' | 'crashedPermanently' | 'destroyed';

export interface ICKEditorError {
	message:string;
	stack:any;
}

export interface ICKEditorWatchdog {
	setCreator(callback:(elementOrData:any, editorConfig:any) => Promise<ICKEditorInstance>):void;
	setDestructor(callback:(editor:ICKEditorInstance) => void):void;
	create(elementOrData:any, editorConfig:any):Promise<ICKEditorInstance>;
	destroy():void;
	on(listener:'stateChange', callback:() => void):void;
	on(listener:'error', callback:(evt:Event, args:{ error:ICKEditorError }) => void):void;
	editor:ICKEditorInstance;
	state:ICKEditorState;
}

export type ICKEditorMentionType = 'user' | 'work_package';

export interface ICKEditorContext {
	resource?:{
		canAddAttachments?:boolean;
		[key:string]:unknown;
	};
	field?:string;
	removePlugins?:string[];
	macros?:false|string[];
	options?:{
		rtl?:boolean;
	};
	previewContext?:string;
	disabledMentions?:ICKEditorMentionType[];
	storageKey?:string;
}

export class ConstrainedEditor extends DecoupledEditor {}
export class FullEditor extends DecoupledEditor {}

export const OPEditorWatchdog = EditorWatchdog as unknown as ICKEditorWatchdog;

// Export the two common interfaces
window.OPConstrainedEditor = ConstrainedEditor;
window.OPClassicEditor = FullEditor;

// Export the Watchdog feature
window.OPEditorWatchdog = OPEditorWatchdog;

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
		'opContentRevisions',
		'undo',
		'redo',
		'openProjectShowFormattingHelp',
		'preview',
		'opShowSource'
	]
};
