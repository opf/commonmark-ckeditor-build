import type { Editor, EditorConfig, PluginConstructor } from '@ckeditor/ckeditor5-core';
import {opImageUploadPlugins, opMacroPlugins} from './op-plugins';
import type { ICKEditorMentionType } from './ckeditor-types';

interface OpenProjectContext {
	resource?:{
		canAddAttachments?:boolean;
	};
	macros?:false|string[];
	disabledMentions?:ICKEditorMentionType[];
}

type OpenProjectConfigValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| string[]
	| {
		context:OpenProjectContext;
		disableAllMacros?:boolean;
	}
	| OpenProjectContext
	| Array<string|PluginConstructor<Editor>>
	| ICKEditorMentionType[];

export interface OpenProjectEditorConfig {
	openProject:{
		context:OpenProjectContext;
		disableAllMacros?:boolean;
	};
	removePlugins?:Array<string|PluginConstructor<Editor>>;
	disabledMentions?:ICKEditorMentionType[];
	[key:string]:OpenProjectConfigValue;
}

export interface OpenProjectEditorClass {
	create(wrapper:string|HTMLElement, configuration?:EditorConfig):Promise<Editor>;
}

export function configurationCustomizer(editorClass:OpenProjectEditorClass) {
	return (wrapper:string|HTMLElement, configuration:OpenProjectEditorConfig) => {
		const context = configuration.openProject.context;

		// We're going to remove some plugins from the default configuration
		// when we detect they are unsupported in the current context
		configuration.removePlugins = configuration.removePlugins || [];

		// Disable uploading if there is no resource with uploadAttachment
		const resource = context.resource;
		if (!(resource && resource.canAddAttachments)) {
			configuration.removePlugins.push(...opImageUploadPlugins.map(el => el.pluginName))
		}

		// Disable macros entirely
		if (context.macros === false) {
			configuration.openProject.disableAllMacros = true;
			configuration.removePlugins.push(...opMacroPlugins.map(el => el.pluginName))
		}

		// Enable selective macros
		const macros = context.macros;
		if (Array.isArray(macros)) {
			const disabledMacros = opMacroPlugins.filter(plugin => macros.indexOf(plugin.pluginName) === -1);
			configuration.removePlugins.push(...disabledMacros);
		}

		// Disable specific mentions
		configuration.disabledMentions = [];
		const disabledMentions = context.disabledMentions;
		if (Array.isArray(disabledMentions)) {
			configuration.disabledMentions = disabledMentions;
		}

		// Return the original promise for instance creation
		return editorClass.create(wrapper, configuration as EditorConfig).then((editor:Editor) => {
			return editor;
		});
	};
}
