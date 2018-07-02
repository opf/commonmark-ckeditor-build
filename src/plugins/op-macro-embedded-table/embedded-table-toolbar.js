import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import ToolbarView from '@ckeditor/ckeditor5-ui/src/toolbar/toolbarview';
import ContextualBalloon from '@ckeditor/ckeditor5-ui/src/panel/balloon/contextualballoon';

import imageIcon from '../../icons/edit.svg';
import {repositionContextualBalloon, isEmbeddedTableWidgetSelected, getBalloonPositionData} from './utils';
import ButtonView from '@ckeditor/ckeditor5-ui/src/button/buttonview';


const balloonClassName = 'ck-toolbar-container';

export default class EmbeddedTableToolbar extends Plugin {
	static get requires() {
		return [ ContextualBalloon ];
	}

	static get pluginName() {
		return 'EmbeddedTableToolbar';
	}

	init() {
		const editor = this.editor;
		const model = this.editor.model;
		const pluginContext = editor.config.get('openProject.pluginContext');

		// If the `BalloonToolbar` plugin is loaded, it should be disabled for images
		// which have their own toolbar to avoid duplication.
		const balloonToolbar = editor.plugins.get( 'BalloonToolbar' );
		if ( balloonToolbar ) {
			this.listenTo( balloonToolbar, 'show', evt => {
				if ( isEmbeddedTableWidgetSelected( editor.editing.view.document.selection ) ) {
					evt.stop();
				}
			}, { priority: 'high' } );
		}

		// Add editing button
		editor.ui.componentFactory.add( 'opEditEmbeddedTableQuery', locale => {
			const view = new ButtonView( locale );

			view.set( {
				label: 'Edit embedded table',
				icon: imageIcon,
				tooltip: true
			} );

			// Callback executed once the widget is clicked.
			view.on( 'execute', () => {

				const tableWidget = model.document.selection.getSelectedElement();

				if (!tableWidget) {
					return;
				}

				const externalQueryConfiguration = pluginContext.services.externalQueryConfiguration;
				const currentQuery = tableWidget.getAttribute('opEmbeddedTableQuery') || {};

				externalQueryConfiguration.show(
					currentQuery,
					(newQuery) => model.change(writer => {
						writer.setAttribute( 'opEmbeddedTableQuery', newQuery, tableWidget );
					})
				);
			} );

			return view;
		} );

	}

	afterInit() {
		const editor = this.editor;
		const toolbarConfig = editor.config.get( 'opEmbeddedTable.toolbar' );

		// Don't add the toolbar if there is no configuration.
		if ( !toolbarConfig || !toolbarConfig.length ) {
			return;
		}

		this._balloon = this.editor.plugins.get( 'ContextualBalloon' );
		this._toolbar = new ToolbarView();

		// Add buttons to the toolbar.
		this._toolbar.fillFromConfig( toolbarConfig, editor.ui.componentFactory );

		// Show balloon panel each time table widget is selected.
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
			if ( isEmbeddedTableWidgetSelected(editor.editing.view.document.selection ) ) {
				this._showToolbar();
			} else {
				this._hideToolbar();
			}
		}
	}

	_showToolbar() {
		const editor = this.editor;

		if ( this._isVisible ) {
			repositionContextualBalloon( editor );
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
