
import BalloonPanelView from '@ckeditor/ckeditor5-ui/src/panel/balloon/balloonpanelview';


/**
 * A helper utility that positions the
 * {@link module:ui/panel/balloon/contextualballoon~ContextualBalloon contextual balloon} instance
 * with respect to the element in the editor content, if one is selected.
 *
 * @param {module:core/editor/editor~Editor} editor The editor instance.
 */
export function repositionContextualBalloon( editor, selectionCallback ) {
	const balloon = editor.plugins.get( 'ContextualBalloon' );

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
export function getBalloonPositionData( editor ) {
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
