import {opImageUploadPlugins, opMacroPlugins} from './op-plugins';

export function configurationCustomizer(editorClass) {
	return (wrapper, configuration) => {
		const context = configuration.openProject.context;

		// We're going to remove some plugins from the default configuration
		// when we detect they are unsupported in the current context
		configuration.removePlugins = configuration.removePlugins || [];

		// Disable uploading if there is no resource with uploadAttachment
		const resource = context.resource;
		if (!(resource && resource.uploadAttachments)) {
			configuration.removePlugins.push(...opImageUploadPlugins.map(el => el.pluginName))
		}

		// Disable macros entirely
		if (context.macros === false) {
			configuration.removePlugins.push(...opMacroPlugins.map(el => el.pluginName))
		}

		// Enable selective macros
		if (Array.isArray(context.macros)) {
			const disabledMacros = opMacroPlugins.filter(plugin = context.macros.indexOf(el.pluginName) === -1);
			configuration.removePlugins.push(...disabledMacros);
		}

		// Return the original promise for instance creation
		return editorClass.create(wrapper, configuration);
	};
}
