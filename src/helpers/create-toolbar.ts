import { ToolbarView } from '@ckeditor/ckeditor5-ui';
import { BalloonPanelView } from '@ckeditor/ckeditor5-ui';
import { ContextualBalloon } from '@ckeditor/ckeditor5-ui';
import type {Editor, Plugin} from '@ckeditor/ckeditor5-core';
import type DocumentSelection from '@ckeditor/ckeditor5-engine/src/view/documentselection';

const balloonClassName = 'ck-toolbar-container';

type IsWidgetSelected = (selection:DocumentSelection) => boolean;

export function createEditToolbar(
	// Plugin instance
	plugin:Plugin,
	// Editor instance
	editor:Editor,
	// Configuration namespace in op-ckeditor.js
	config_namespace:string,
	// Callback to check if widget is selected
	isWidgetSelected:IsWidgetSelected
) {

	const toolbarConfig = editor.config.get( config_namespace + '.toolbar' ) as string[] | undefined;

	// Don't add the toolbar if there is no configuration.
	if ( !toolbarConfig || !toolbarConfig.length ) {
		return;
	}

	const _balloon = editor.plugins.get( 'ContextualBalloon' ) as ContextualBalloon;
	const _toolbar = new ToolbarView( editor.locale );

	function _checkIsVisible() {
		if ( !editor.ui.focusTracker.isFocused ) {
			_hideToolbar();
		} else {
			if ( isWidgetSelected(editor.editing.view.document.selection ) ) {
				_showToolbar();
			} else {
				_hideToolbar();
			}
		}
	}

	function _showToolbar() {
		if ( _isVisible() ) {
			repositionContextualBalloon( editor, isWidgetSelected );
		} else if ( !_balloon.hasView( _toolbar ) ) {
			_balloon.add( {
				view: _toolbar,
				position: getBalloonPositionData( editor ),
				balloonClassName
			} );
		}
	}

	function _hideToolbar() {
		if ( !_isVisible() ) {
			return;
		}

		_balloon.remove( _toolbar );
	}

	function _isVisible() {
		return _balloon.visibleView == _toolbar;
	}

	// Add buttons to the toolbar.
	_toolbar.fillFromConfig( toolbarConfig, editor.ui.componentFactory );

	// Show balloon panel each time the widget is selected.
	// TODO: This has changed in master with https://github.com/ckeditor/ckeditor5-image/pull/215
	plugin.listenTo( editor.editing.view, 'render', _checkIsVisible);

	// UI#update is not fired after focus is back in editor, we need to check if balloon panel should be visible.
	plugin.listenTo( editor.ui.focusTracker, 'change:isFocused', _checkIsVisible, { priority: 'low' } );
}


/**
 * A helper utility that positions the
 * {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon contextual balloon} instance
 * with respect to the element in the editor content, if one is selected.
 *
 * @param {module:core/editor/editor~Editor} editor The editor instance.
 */
function repositionContextualBalloon( editor:Editor, selectionCallback:IsWidgetSelected ) {
	const balloon = editor.plugins.get( 'ContextualBalloon' ) as ContextualBalloon;

	if ( selectionCallback( editor.editing.view.document.selection ) ) {
		const position = getBalloonPositionData( editor );

		balloon.updatePosition( position );
	}
}


/**
 * Returns the positioning options that control the geometry of the
 * {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon contextual balloon} with respect
 * to the selected element in the editor content.
 *
 * @param {module:core/editor/editor~Editor} editor The editor instance.
 * @returns {module:utils/dom/position~Options}
 */
function getBalloonPositionData( editor:Editor ) {
	const editingView = editor.editing.view;
	const defaultPositions = BalloonPanelView.defaultPositions;

	return {
		target: editingView.domConverter.viewToDom( editingView.document.selection.getSelectedElement() ),
		positions: [
			defaultPositions.northArrowSouth,
			defaultPositions.northArrowSouthWest,
			defaultPositions.northArrowSouthEast,
			defaultPositions.southArrowNorth,
			defaultPositions.southArrowNorthWest,
			defaultPositions.southArrowNorthEast
		]
	};
}
