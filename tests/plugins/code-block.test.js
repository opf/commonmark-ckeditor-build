import { textContentOf } from '../../src/plugins/code-block/converters';

// Minimal stand-ins for CKEditor view nodes. `textContentOf` only relies
// on `is()`, `getChildren()` and `data`, so faking those keeps the test
// independent of engine internals while still exercising the regression.
function viewText( data ) {
	return {
		data,
		is: type => type === '$text',
	};
}

function viewElement( name, children = [] ) {
	return {
		is: ( type, elementName ) => type === 'element' && ( elementName === undefined || elementName === name ),
		getChildren: () => children,
	};
}

describe( 'code-block converters', () => {
	describe( 'textContentOf', () => {
		it( 'reads a plain text node', () => {
			expect( textContentOf( viewText( 'const x = 1;\n' ) ) ).toEqual( 'const x = 1;\n' );
		} );

		it( 'reads a <code> wrapping a single text node', () => {
			const code = viewElement( 'code', [ viewText( 'plain code' ) ] );

			expect( textContentOf( code ) ).toEqual( 'plain code' );
		} );

		it( 'reads a <code> whose children are elements (syntax highlighting) without throwing (COMMS-572)', () => {
			// Pasted rich text: the <code> first child is a <span>, not text,
			// so the previous `getChild(0).data.replace(...)` threw.
			const code = viewElement( 'code', [
				viewElement( 'span', [ viewText( 'const ' ) ] ),
				viewElement( 'span', [ viewText( 'x' ) ] ),
				viewText( ' = 1;' ),
			] );

			expect( () => textContentOf( code ) ).not.toThrow();
			expect( textContentOf( code ) ).toEqual( 'const x = 1;' );
		} );

		it( 'reads deeply nested highlight markup', () => {
			const code = viewElement( 'code', [
				viewElement( 'span', [
					viewElement( 'span', [ viewText( 'a' ) ] ),
					viewText( 'b' ),
				] ),
			] );

			expect( textContentOf( code ) ).toEqual( 'ab' );
		} );

		it( 'returns an empty string for an empty element', () => {
			expect( textContentOf( viewElement( 'code', [] ) ) ).toEqual( '' );
		} );
	} );
} );
