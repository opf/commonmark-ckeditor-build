import { EmitterMixin } from '@ckeditor/ckeditor5-utils';
import OPPasteGuard from '../../src/plugins/op-paste-guard/op-paste-guard-plugin.js';

// A real CKEditor emitter stands in for the ClipboardPipeline so the
// guard's 'high'-priority listener and the pipeline's 'low'-priority
// default insertion handler interact exactly as they do in the editor.
const Emitter = EmitterMixin();

// Minimal model writer: records the fragment tree the fallback builds.
function fakeWriter() {
	return {
		createDocumentFragment: () => ( { name: '$fragment', children: [] } ),
		createElement: name => ( { name, children: [] } ),
		createText: text => ( { name: '$text', text } ),
		append: ( node, parent ) => parent.children.push( node ),
	};
}

function fakeEditor( { toModel } ) {
	const editor = {
		fired: [],
		inserted: [],
		fire( name, data ) {
			this.fired.push( { name, data } );
		},
		data: { toModel },
		model: {
			change( callback ) {
				callback( editor.writer );
			},
			insertContent( fragment ) {
				editor.inserted.push( fragment );
			},
		},
		writer: fakeWriter(),
	};

	const clipboardPipeline = new Emitter();
	editor.plugins = {
		get: name => ( name === 'ClipboardPipeline' ? clipboardPipeline : null ),
	};
	editor.clipboardPipeline = clipboardPipeline;

	return editor;
}

function pasteData( { plainText = '', isEmpty = false } = {} ) {
	return {
		content: { isEmpty },
		dataTransfer: {
			getData: type => ( type === 'text/plain' ? plainText : '' ),
		},
	};
}

function initGuard( editor ) {
	new OPPasteGuard( editor ).init();
}

describe( 'OPPasteGuard', () => {
	test( 'dry-runs the conversion with the pipeline\'s $clipboardHolder context', () => {
		const toModel = jest.fn();
		const editor = fakeEditor( { toModel } );
		initGuard( editor );

		const data = pasteData();
		editor.clipboardPipeline.fire( 'inputTransformation', data );

		expect( toModel ).toHaveBeenCalledWith( data.content, '$clipboardHolder' );
	} );

	test( 'lets a healthy paste reach the default insertion handler untouched', () => {
		const editor = fakeEditor( { toModel: () => ( {} ) } );
		initGuard( editor );

		let defaultHandlerRan = false;
		editor.clipboardPipeline.on( 'inputTransformation', () => {
			defaultHandlerRan = true;
		}, { priority: 'low' } );

		editor.clipboardPipeline.fire( 'inputTransformation', pasteData() );

		expect( defaultHandlerRan ).toBe( true );
		expect( editor.fired ).toEqual( [] );
		expect( editor.inserted ).toEqual( [] );
	} );

	test( 'skips empty clipboard content without converting it', () => {
		const toModel = jest.fn();
		const editor = fakeEditor( { toModel } );
		initGuard( editor );

		editor.clipboardPipeline.fire( 'inputTransformation', pasteData( { isEmpty: true } ) );

		expect( toModel ).not.toHaveBeenCalled();
	} );

	test( 'stops a broken paste before the default handler and notifies the host', () => {
		const error = new Error( 'upcast converter blew up' );
		const editor = fakeEditor( { toModel: () => {
			throw error;
		} } );
		initGuard( editor );

		let defaultHandlerRan = false;
		editor.clipboardPipeline.on( 'inputTransformation', () => {
			defaultHandlerRan = true;
		}, { priority: 'low' } );

		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		editor.clipboardPipeline.fire( 'inputTransformation', pasteData( { plainText: 'fallback' } ) );
		console.error.mockRestore();

		expect( defaultHandlerRan ).toBe( false );
		expect( editor.fired ).toEqual( [ { name: 'op:clipboard-paste-error', data: { error } } ] );
	} );

	test( 'inserts the plain-text fallback as one paragraph per line', () => {
		const editor = fakeEditor( { toModel: () => {
			throw new Error( 'boom' );
		} } );
		initGuard( editor );

		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		editor.clipboardPipeline.fire( 'inputTransformation', pasteData( { plainText: 'line1\r\n\nline3' } ) );
		console.error.mockRestore();

		expect( editor.inserted ).toHaveLength( 1 );
		const paragraphs = editor.inserted[ 0 ].children;
		expect( paragraphs.map( p => p.name ) ).toEqual( [ 'paragraph', 'paragraph', 'paragraph' ] );
		expect( paragraphs[ 0 ].children ).toEqual( [ { name: '$text', text: 'line1' } ] );
		expect( paragraphs[ 1 ].children ).toEqual( [] );
		expect( paragraphs[ 2 ].children ).toEqual( [ { name: '$text', text: 'line3' } ] );
	} );

	test( 'inserts nothing when the clipboard has no plain-text representation', () => {
		const editor = fakeEditor( { toModel: () => {
			throw new Error( 'boom' );
		} } );
		initGuard( editor );

		jest.spyOn( console, 'error' ).mockImplementation( () => {} );
		editor.clipboardPipeline.fire( 'inputTransformation', pasteData( { plainText: '' } ) );
		console.error.mockRestore();

		expect( editor.inserted ).toEqual( [] );
		expect( editor.fired.map( f => f.name ) ).toEqual( [ 'op:clipboard-paste-error' ] );
	} );
} );
