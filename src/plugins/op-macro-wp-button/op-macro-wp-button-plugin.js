import Widget from '@ckeditor/ckeditor5-widget/src/widget';
import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import OPMacroWpButtonEditing from './op-macro-wp-button-editing';
import OPMacroWpButtonToolbar from './op-macro-wp-button-toolbar';

export default class OPMacroWpButtonPlugin extends Plugin {
	static get requires() {
		return [ OPMacroWpButtonEditing, Widget, OPMacroWpButtonToolbar ];
	}

	static get pluginName() {
		return 'OPMacroWpButton';
	}

	static get buttonName() {
		return OPMacroWpButtonEditing.buttonName;
	}
}
