import { Editor } from '@ckeditor/ckeditor5-core';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { HorizontalLineEditing } from '@ckeditor/ckeditor5-horizontal-line';
import CommonMarkPlugin from '../../src/commonmark/commonmark';

class HeadlessEditor extends Editor {
	constructor( config ) {
		super( config );
		this.model.document.createRoot();
	}

	static async create( config ) {
		const editor = new this( config );
		await editor.initPlugins();
		editor.data.init( '' );
		editor.fire( 'ready' );

		return editor;
	}
}

describe( 'HorizontalLineEditing', () => {
	let editor;

	beforeEach( async () => {
		editor = await HeadlessEditor.create( {
			licenseKey: 'GPL',
			plugins: [ Paragraph, HorizontalLineEditing, CommonMarkPlugin ]
		} );
	} );

	afterEach( async () => {
		await editor.destroy();
	} );

	it( 'keeps a horizontal rule when loading and saving markdown', () => {
		editor.setData( 'First slide\n\n---\n\nSecond slide' );

		expect( editor.getData() ).toEqual( 'First slide\n\n* * *\n\nSecond slide' );
	} );

	it( 'serializes an inserted horizontal line to markdown', () => {
		editor.setData( 'First slide' );
		editor.execute( 'horizontalLine' );

		expect( editor.getData() ).toContain( '* * *' );
	} );
} );
