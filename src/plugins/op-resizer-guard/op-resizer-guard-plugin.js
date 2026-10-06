import { Plugin } from '@ckeditor/ckeditor5-core';
import { WidgetResize } from '@ckeditor/ckeditor5-widget';

// Guards the image resizer against the self-feeding redraw recursion that
// crashes the editor when an inline image without a persisted width is selected.
//
// WidgetResize listens to EditorUI#update and (re)draws the selected resizer.
// Resizer#redraw calls view.change() to write the measured size back to the
// view, which re-emits EditorUI#update, which redraws again. For an inline image
// with no stored width and resizeUnit:'px', the measured (sub-pixel, device-pixel
// rounded) size never matches what was written, so the cycle never converges and
// recurses until the call stack overflows — taking down the editor via the
// watchdog and losing content (COMMS-861 / COMMS-860 / OP-19619).
//
// The redraw that view.change() triggers re-enters redrawSelectedResizer
// synchronously (confirmed by the crash stack), so a simple in-progress flag is
// enough to break the recursion: the legitimate first redraw still runs and the
// resizer still renders; only the re-entrant redraw it would feed itself is
// skipped.
export default class OPResizerGuard extends Plugin {
	static get requires() {
		return [ WidgetResize ];
	}

	static get pluginName() {
		return 'OPResizerGuard';
	}

	afterInit() {
		const widgetResize = this.editor.plugins.get( 'WidgetResize' );

		// The EditorUI#update listener (and the window-resize listener) call
		// this.redrawSelectedResizer() through a throttled wrapper that looks the
		// method up dynamically, so reassigning the instance method is enough to
		// guard every entry point without touching the listener registration.
		const original = widgetResize.redrawSelectedResizer.bind( widgetResize );
		let inProgress = false;

		widgetResize.redrawSelectedResizer = function () {
			if ( inProgress ) {
				return;
			}

			inProgress = true;
			try {
				return original();
			} finally {
				inProgress = false;
			}
		};
	}
}
