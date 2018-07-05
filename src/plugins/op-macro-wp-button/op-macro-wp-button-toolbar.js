import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ToolbarView from '@ckeditor/ckeditor5-ui/src/toolbar/toolbarview';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';

import imageIcon from '../../icons/edit.svg';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';
import {repositionContextualBalloon, getBalloonPositionData} from '../toolbar-utils';
import {isWpButtonMacroWidgetselected} from './utils';


const balloonClassName = 'ck-toolbar-container';

export default class OPMacroWpButtonToolbar extends Plugin {
	static get requires() {
		return [ ContextualBalloon ];
	}

	static get pluginName() {
		return 'OPMacroWpButtonToolbar';
	}

	init() {
		const editor = this.editor;
		const model = this.editor.model;
		const pluginContext = editor.config.get('openProject.pluginContext');

		// Add editing button
		editor.ui.componentFactory.add( 'opEditWpMacroButton', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: I18n.t('js.button_edit'),
				icon: imageIcon,
				tooltip: true
			} );

			// Callback executed once the widget is clicked.
			view.on( 'execute', () => {

				const buttonWidget = model.document.selection.getSelectedElement();

				if (!buttonWidget) {
					return;
				}

				const macroService = pluginContext.services.macros;
				const type = buttonWidget.getAttribute('type');
				const classes = buttonWidget.getAttribute('classes');

				macroService
					.configureWorkPackageButton(type, classes)
					.then((result) => editor.model.change(writer => {
						writer.setAttribute( 'classes', result.classes, buttonWidget );
						writer.setAttribute( 'type', result.type, buttonWidget );
					})
				);
			} );

			return view;
		} );

	}

	afterInit() {
		const editor = this.editor;
		const toolbarConfig = editor.config.get( 'OPMacroWpButton.toolbar' );

		// Don't add the toolbar if there is no configuration.
		if ( !toolbarConfig || !toolbarConfig.length ) {
			return;
		}

		this._balloon = this.editor.plugins.get( 'ContextualBalloon' );
		this._toolbar = new ToolbarView();

		// Add buttons to the toolbar.
		this._toolbar.fillFromConfig( toolbarConfig, editor.ui.componentFactory );

		// Show balloon panel each time the widget is selected.
		// TODO: This has changed in master with https://github.com/ckeditor/ckeditor5-image/pull/215
		this.listenTo( editor.editing.view, 'render', () => {
			this._checkIsVisible();
		} );
		// UI#update is not fired after focus is back in editor, we need to check if balloon panel should be visible.
		this.listenTo( editor.ui.focusTracker, 'change:isFocused', () => {
			this._checkIsVisible();
		}, { priority: 'low' } );
	}

	_checkIsVisible() {
		const editor = this.editor;

		if ( !editor.ui.focusTracker.isFocused ) {
			this._hideToolbar();
		} else {
			if ( isWpButtonMacroWidgetselected(editor.editing.view.document.selection ) ) {
				this._showToolbar();
			} else {
				this._hideToolbar();
			}
		}
	}

	_showToolbar() {
		const editor = this.editor;

		if ( this._isVisible ) {
			repositionContextualBalloon( editor, isWpButtonMacroWidgetselected );
		} else if ( !this._balloon.hasView( this._toolbar ) ) {
			this._balloon.add( {
				view: this._toolbar,
				position: getBalloonPositionData( editor ),
				balloonClassName
			} );
		}
	}

	_hideToolbar() {
		if ( !this._isVisible ) {
			return;
		}

		this._balloon.remove( this._toolbar );
	}

	get _isVisible() {
		return this._balloon.visibleView == this._toolbar;
	}
}
