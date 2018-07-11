// This SVG file import will be handled by webpack's raw-text loader.
// This means that imageIcon will hold the source SVG.
import imageIcon from './../../icons/help.svg';

import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';

import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class OPHelpLinkPlugin extends Plugin {

	static get pluginName() {
		return 'OPHelpLinkPlugin';
	}

	init() {
		const editor = this.editor;
		const model = editor.model;
		const helpURL = editor.config.get('openProject.helpURL');

		editor.ui.componentFactory.add( 'openProjectShowFormattingHelp', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: window.I18n.t('js.inplace.link_formatting_help'),
				icon: imageIcon,
				tooltip: true
			} );

			// Callback executed once the image is clicked.
			view.on( 'execute', () => {
				window.open(helpURL, '_blank');
			} );

			return view;
		} );
	}
}
