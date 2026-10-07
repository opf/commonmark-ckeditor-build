import { textContentOf } from '../../src/plugins/code-block/converters';

type FakeNode = Parameters<typeof textContentOf>[0];

// Minimal stand-ins for CKEditor view nodes. `textContentOf` only relies
// on `is()`, `getChildren()` and `data`, so faking those keeps the test
// independent of engine internals.
function viewText( data: string ): FakeNode {
	return {
		data,
		is: ( type: string ) => type === '$text',
	};
}

function viewElement( name: string, children: FakeNode[] = [] ): FakeNode {
	return {
		is: ( type: string, elementName?: string ) => type === 'element' && ( elementName === undefined || elementName === name ),
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

		it( 'reads a <code> whose children are elements (syntax highlighting) without throwing', () => {
			// Pasted rich text: the <code> first child is a <span>, not text.
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
