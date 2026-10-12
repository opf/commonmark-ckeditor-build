import type { PluginConstructor } from '@ckeditor/ckeditor5-core';

/**
 * Names of the given plugins. CKEditor's `removePlugins` accepts plugin
 * constructors as well as plugin names.
 */
export function pluginNames(plugins: ReadonlyArray<PluginConstructor | string>): string[] {
	return plugins.flatMap(plugin => {
		const name = typeof plugin === 'string' ? plugin : plugin.pluginName;

		return name ? [name] : [];
	});
}
