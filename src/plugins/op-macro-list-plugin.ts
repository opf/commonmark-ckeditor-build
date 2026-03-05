import { Plugin } from '@ckeditor/ckeditor5-core';

import { createDropdown, addToolbarToDropdown } from '@ckeditor/ckeditor5-ui/src/dropdown/utils';

import {opMacroPlugins} from "../op-plugins";
import type { PluginConstructor, Editor } from '@ckeditor/ckeditor5-core';

function pluginNameOf(plugin:string|PluginConstructor<Editor>):string {
	if (typeof plugin === 'string') {
		return plugin;
	}

	return (plugin as { pluginName?:string }).pluginName || '';
}

/**
 * Adding a drop down list of macros to the toolbar.
 *
 * @extends module:core/plugin~Plugin
 */
export default class OPMacroListPlugin extends Plugin {
	init() {
		const editor = this.editor;
		const removePlugins = editor.config.get('removePlugins') || [];
		const disabledPluginNames = removePlugins.map(pluginNameOf);
		const dropdownTooltip = window.I18n.t('js.editor.macro.dropdown.chose_macro');

		// Skip if we don't have any macros here
		if (editor.config.get('openProject.disableAllMacros') === true) {
			return;
		}

		// Register UI component.
		editor.ui.componentFactory.add( 'macroList', locale => {
			const dropdownItems = [];
			for ( const macroPlugin of opMacroPlugins ) {
				if (disabledPluginNames.indexOf(macroPlugin.pluginName) !== -1) {
					continue;
				}

				const listItem = editor.ui.componentFactory.create(macroPlugin.buttonName);
				dropdownItems.push(listItem);
			}
			const dropdownView = createDropdown( locale );

			addToolbarToDropdown(dropdownView, dropdownItems, { isVertical: true, class: 'op-macro-list-button' });
			dropdownView.buttonView.set( {
				isOn: false,
				withText: true,
				tooltip: dropdownTooltip,
				label: window.I18n.t('js.editor.macro.dropdown.macros')
			} );

			return dropdownView;
		} );
	}
}
