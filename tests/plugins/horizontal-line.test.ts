import { Editor } from '@ckeditor/ckeditor5-core';
import type { EditorConfig } from '@ckeditor/ckeditor5-core';
import type { EditorUI } from '@ckeditor/ckeditor5-ui';
import { Paragraph } from '@ckeditor/ckeditor5-paragraph';
import { HorizontalLineEditing } from '@ckeditor/ckeditor5-horizontal-line';
import CommonMarkPlugin from '../../src/commonmark/commonmark';

class HeadlessEditor extends Editor {
	constructor( config: EditorConfig ) {
		super( config );
		this.model.document.createRoot();
	}

	// The abstract Editor#ui member must exist, but this headless editor
	// runs no UI, and nothing under test touches it.
	override get ui(): EditorUI {
		throw new Error( 'HeadlessEditor has no UI.' );
	}

	static override async create( config: EditorConfig ): Promise<HeadlessEditor> {
		const editor = new this( config );
		await editor.initPlugins();
		editor.data.init( '' );
		editor.fire( 'ready' );

		return editor;
	}
}

describe( 'HorizontalLineEditing', () => {
	let editor: HeadlessEditor;

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
