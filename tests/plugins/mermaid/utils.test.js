import { checkIsOn, debounce } from '../../../src/plugins/mermaid/utils';

// Minimal stand-in for a model selection holding a single mermaid element.
function editorWithSelectedElement( element ) {
	return {
		model: {
			document: {
				selection: {
					getSelectedElement: () => element,
					getLastPosition: () => null,
				}
			}
		}
	};
}

function mermaidElement( displayMode ) {
	return {
		is: ( type, name ) => type === 'element' && name === 'mermaid',
		getAttribute: name => ( name === 'displayMode' ? displayMode : undefined ),
	};
}

describe( 'mermaid utils', () => {
	describe( 'debounce', () => {
		beforeEach( () => jest.useFakeTimers() );
		afterEach( () => jest.useRealTimers() );

		it( 'calls the function once after the wait has passed', () => {
			const fn = jest.fn();
			const debounced = debounce( fn, 300 );

			debounced( 'a' );
			debounced( 'b' );
			debounced( 'c' );

			expect( fn ).not.toHaveBeenCalled();

			jest.advanceTimersByTime( 300 );

			expect( fn ).toHaveBeenCalledTimes( 1 );
			expect( fn ).toHaveBeenCalledWith( 'c' );
		} );

		it( 'calls the function again for a later burst', () => {
			const fn = jest.fn();
			const debounced = debounce( fn, 300 );

			debounced( 'first' );
			jest.advanceTimersByTime( 300 );
			debounced( 'second' );
			jest.advanceTimersByTime( 300 );

			expect( fn ).toHaveBeenCalledTimes( 2 );
		} );
	} );

	describe( 'checkIsOn', () => {
		it( 'is on for the mode the selected diagram is in', () => {
			const editor = editorWithSelectedElement( mermaidElement( 'split' ) );

			expect( checkIsOn( editor, 'split' ) ).toBe( true );
			expect( checkIsOn( editor, 'preview' ) ).toBe( false );
		} );

		it( 'is off without a selected element', () => {
			expect( checkIsOn( editorWithSelectedElement( null ), 'split' ) ).toBe( false );
		} );

		it( 'is off for a selected element that is not a diagram', () => {
			const paragraph = {
				is: () => false,
				getAttribute: () => 'split',
			};

			expect( checkIsOn( editorWithSelectedElement( paragraph ), 'split' ) ).toBe( false );
		} );
	} );
} );
