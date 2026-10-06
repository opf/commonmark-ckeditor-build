import MermaidEditing from '../../../src/plugins/mermaid/mermaid_editing';

// Minimal stand-ins for CKEditor view nodes, enough for the upcast and for
// `textContentOf` to walk the <code> element.
function viewText( data ) {
	return {
		data,
		is: type => type === '$text',
	};
}

function viewElement( name, { classes = [], children = [] } = {} ) {
	return {
		name,
		is: ( type, elementName ) => type === 'element' && ( elementName === undefined || elementName === name ),
		hasClass: cls => classes.includes( cls ),
		getChildren: () => children,
	};
}

function codeBlock( language, source ) {
	return viewElement( 'pre', {
		children: [ viewElement( 'code', { classes: [ language ], children: [ viewText( source ) ] } ) ],
	} );
}

function upcastArgs( viewPre ) {
	const conversionApi = {
		consumable: {
			test: jest.fn( () => true ),
			consume: jest.fn( () => true ),
		},
		writer: {
			createElement: jest.fn( ( name, attributes ) => ( { name, attributes } ) ),
		},
		safeInsert: jest.fn( () => true ),
		updateConversionResult: jest.fn(),
	};

	const data = {
		viewItem: viewPre,
		modelCursor: { findAncestor: () => null },
	};

	return { data, conversionApi };
}

describe( 'MermaidEditing', () => {
	describe( 'upcast', () => {
		it( 'converts a mermaid code block into a mermaid element', () => {
			const plugin = new MermaidEditing( {} );
			const { data, conversionApi } = upcastArgs( codeBlock( 'language-mermaid', 'flowchart TB\nA --> B' ) );

			plugin._mermaidUpcast( null, data, conversionApi );

			expect( conversionApi.writer.createElement ).toHaveBeenCalledWith( 'mermaid', {
				source: 'flowchart TB\nA --> B',
				displayMode: 'split',
			} );
			expect( conversionApi.safeInsert ).toHaveBeenCalled();
			expect( conversionApi.updateConversionResult ).toHaveBeenCalled();
			// Both the <pre> and the <code> are claimed, so the code block plugin leaves them alone.
			expect( conversionApi.consumable.consume ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'drops the trailing newline markdown-it adds to a fenced block', () => {
			const plugin = new MermaidEditing( {} );
			const { data, conversionApi } = upcastArgs( codeBlock( 'language-mermaid', 'flowchart TB\n' ) );

			plugin._mermaidUpcast( null, data, conversionApi );

			expect( conversionApi.writer.createElement ).toHaveBeenCalledWith( 'mermaid', {
				source: 'flowchart TB',
				displayMode: 'split',
			} );
		} );

		it( 'leaves a code block of another language to the code block plugin', () => {
			const plugin = new MermaidEditing( {} );
			const { data, conversionApi } = upcastArgs( codeBlock( 'language-ruby', 'puts 1' ) );

			plugin._mermaidUpcast( null, data, conversionApi );

			expect( conversionApi.writer.createElement ).not.toHaveBeenCalled();
			expect( conversionApi.consumable.consume ).not.toHaveBeenCalled();
		} );

		it( 'consumes nothing when the element cannot be inserted', () => {
			const plugin = new MermaidEditing( {} );
			const { data, conversionApi } = upcastArgs( codeBlock( 'language-mermaid', 'flowchart TB' ) );

			conversionApi.safeInsert.mockReturnValue( false );

			plugin._mermaidUpcast( null, data, conversionApi );

			expect( conversionApi.consumable.consume ).not.toHaveBeenCalled();
			expect( conversionApi.updateConversionResult ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'renderMermaid', () => {
		function pluginWith( mermaid, config = {} ) {
			const plugin = new MermaidEditing( {} );

			plugin._config = {
				lazyLoad: jest.fn( () => mermaid ),
				config,
			};

			return plugin;
		}

		function mermaidStub() {
			return {
				initialize: jest.fn(),
				render: jest.fn( ( id, source ) => Promise.resolve( { svg: `<svg>${ source }</svg>` } ) ),
			};
		}

		it( 'initializes the lazily loaded library once and renders into the element', async () => {
			const mermaid = mermaidStub();
			const plugin = pluginWith( mermaid, { theme: 'neutral' } );
			const domElement = document.createElement( 'div' );

			await plugin.renderMermaid( domElement, 'graph TD' );
			await plugin.renderMermaid( domElement, 'graph LR' );

			expect( plugin._config.lazyLoad ).toHaveBeenCalledTimes( 1 );
			expect( mermaid.initialize ).toHaveBeenCalledWith( { theme: 'neutral' } );
			expect( domElement.innerHTML ).toEqual( '<svg>graph LR</svg>' );
		} );

		it( 'clears the preview for an empty source without rendering', async () => {
			const mermaid = mermaidStub();
			const plugin = pluginWith( mermaid );
			const domElement = document.createElement( 'div' );

			domElement.innerHTML = '<svg>stale</svg>';

			await plugin.renderMermaid( domElement, '   ' );

			expect( domElement.innerHTML ).toEqual( '' );
			expect( mermaid.render ).not.toHaveBeenCalled();
		} );

		it( 'shows the error of a diagram that fails to render', async () => {
			const mermaid = mermaidStub();
			const plugin = pluginWith( mermaid );
			const domElement = document.createElement( 'div' );

			mermaid.render.mockRejectedValue( new Error( 'Parse error on line 1' ) );

			await plugin.renderMermaid( domElement, 'not a diagram' );

			expect( domElement.innerText ).toEqual( 'Parse error on line 1' );
		} );

		it( 'keeps the result of the newest render when an older one finishes last', async () => {
			const mermaid = mermaidStub();
			const plugin = pluginWith( mermaid );
			const domElement = document.createElement( 'div' );

			const stale = plugin.renderMermaid( domElement, 'graph TD' );
			const current = plugin.renderMermaid( domElement, 'graph LR' );

			await Promise.all( [ stale, current ] );

			expect( domElement.innerHTML ).toEqual( '<svg>graph LR</svg>' );
			// The superseded render never reaches the library.
			expect( mermaid.render ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'does nothing when the host configured no library', async () => {
			const plugin = new MermaidEditing( {} );
			const domElement = document.createElement( 'div' );

			domElement.innerHTML = '<svg>kept</svg>';

			await plugin.renderMermaid( domElement, 'graph TD' );

			expect( domElement.innerHTML ).toEqual( '<svg>kept</svg>' );
		} );
	} );
} );
