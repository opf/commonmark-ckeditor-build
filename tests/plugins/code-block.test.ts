import type { DowncastDispatcher } from '@ckeditor/ckeditor5-engine';
import { modelCodeBlockToView, textContentOf } from '../../src/plugins/code-block/converters';

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

	describe( 'modelCodeBlockToView', () => {
		type Converter = ( evt: { stop(): void }, data: unknown, conversionApi: unknown ) => void;

		// Runs the data downcast for a code block with the given model
		// attributes and returns the text nodes it wrote, in order: the
		// language label, then the content.
		function textsWrittenFor( attributes: Record<string, string | undefined> ) {
			const createText = jest.fn( ( data: string ) => ( { data } ) );
			const conversionApi = {
				consumable: { consume: jest.fn() },
				writer: {
					createContainerElement: jest.fn( () => ( {} ) ),
					createText,
					createPositionAt: jest.fn(),
					insert: jest.fn(),
				},
				mapper: { bindElements: jest.fn(), toViewPosition: jest.fn() },
			};
			const converters: Converter[] = [];

			modelCodeBlockToView()( {
				on: ( _event: string, converter: Converter ) => converters.push( converter ),
			} as unknown as DowncastDispatcher );

			converters[ 0 ](
				{ stop: jest.fn() },
				{ item: { getAttribute: ( key: string ) => attributes[ key ] }, range: { start: {} } },
				conversionApi
			);

			return createText.mock.calls.map( ( [ data ] ) => data );
		}

		it( 'writes the content of a code block', () => {
			expect( textsWrittenFor( { opCodeblockLanguage: 'language-ruby', opCodeblockContent: 'puts 1' } ) )
				.toEqual( [ 'language-ruby', 'puts 1' ] );
		} );

		it( 'writes an empty text for a code block without content', () => {
			// An empty <code> is upcast without the content attribute.
			expect( textsWrittenFor( { opCodeblockLanguage: 'language-ruby' } ) )
				.toEqual( [ 'language-ruby', '' ] );
		} );

		it( 'writes an empty text for a code block that held only a newline', () => {
			// The upcast strips the trailing newline, leaving an empty string.
			expect( textsWrittenFor( { opCodeblockLanguage: 'language-ruby', opCodeblockContent: '' } ) )
				.toEqual( [ 'language-ruby', '' ] );
		} );
	} );
} );
