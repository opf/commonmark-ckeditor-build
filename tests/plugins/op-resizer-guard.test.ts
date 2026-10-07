import OPResizerGuard from '../../src/plugins/op-resizer-guard/op-resizer-guard-plugin.js';

// Builds a minimal editor stub exposing only what the plugin touches:
// editor.plugins.get('WidgetResize').
const fakeEditorWith = widgetResize => ( {
	plugins: {
		get: name => ( name === 'WidgetResize' ? widgetResize : null )
	}
} );

describe( 'OPResizerGuard', () => {
	test( 'suppresses the synchronous re-entrant redraw', () => {
		// Models WidgetResize#redrawSelectedResizer, whose view.change() write
		// re-emits EditorUI#update and feeds itself another redraw synchronously.
		// Without the guard this recurses until the call stack overflows.
		let depth = 0;
		let maxDepth = 0;

		const widgetResize = {
			redrawSelectedResizer() {
				depth++;
				maxDepth = Math.max( maxDepth, depth );
				if ( depth < 5 ) {
					this.redrawSelectedResizer();
				}
				depth--;
			}
		};

		new OPResizerGuard( fakeEditorWith( widgetResize ) ).afterInit();

		widgetResize.redrawSelectedResizer();

		// The first (legitimate) redraw runs; the re-entrant one it feeds itself
		// is skipped, so we never nest.
		expect( maxDepth ).toBe( 1 );
	} );

	test( 'still runs the legitimate top-level redraw on every call', () => {
		let calls = 0;
		const widgetResize = {
			redrawSelectedResizer() {
				calls++;
			}
		};

		new OPResizerGuard( fakeEditorWith( widgetResize ) ).afterInit();

		widgetResize.redrawSelectedResizer();
		widgetResize.redrawSelectedResizer();

		expect( calls ).toBe( 2 );
	} );

	test( 'resets the in-progress flag and rethrows when the redraw fails', () => {
		let calls = 0;
		const widgetResize = {
			redrawSelectedResizer() {
				calls++;
				throw new Error( 'boom' );
			}
		};

		new OPResizerGuard( fakeEditorWith( widgetResize ) ).afterInit();

		// The error must propagate, and the finally block must clear the flag so
		// a later call is not permanently swallowed.
		expect( () => widgetResize.redrawSelectedResizer() ).toThrow( 'boom' );
		expect( () => widgetResize.redrawSelectedResizer() ).toThrow( 'boom' );
		expect( calls ).toBe( 2 );
	} );

	test( 'returns the value produced by the original redraw', () => {
		const widgetResize = {
			redrawSelectedResizer() {
				return 'redrawn';
			}
		};

		new OPResizerGuard( fakeEditorWith( widgetResize ) ).afterInit();

		expect( widgetResize.redrawSelectedResizer() ).toBe( 'redrawn' );
	} );
} );
