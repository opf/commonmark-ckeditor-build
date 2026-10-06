import { ObservableMixin } from '@ckeditor/ckeditor5-utils';
import InsertMermaidCommand from '../../../src/plugins/mermaid/insert_mermaid_command';

class FakeEditor extends ObservableMixin() {}

// Minimal stand-in for the model: `change()` hands out a writer whose
// `createElement` records what the command asked for.
function fakeEditor( selectedElement = null ) {
	const editor = new FakeEditor();
	const writer = {
		createElement: jest.fn( ( name, attributes ) => ( { name, attributes } ) ),
	};

	editor.model = {
		change: callback => callback( writer ),
		insertContent: jest.fn(),
		canEditAt: () => true,
		document: {
			selection: {
				getSelectedElement: () => selectedElement,
				// Command#isEnabled checks whether the selection sits in the graveyard.
				getFirstPosition: () => ( { root: { rootName: 'main' } } ),
			}
		}
	};
	editor.model.writer = writer;

	return editor;
}

describe( 'InsertMermaidCommand', () => {
	it( 'is disabled while a diagram is selected', () => {
		const command = new InsertMermaidCommand( fakeEditor( { name: 'mermaid' } ) );

		command.refresh();

		expect( command.isEnabled ).toBe( false );
	} );

	it( 'is enabled elsewhere', () => {
		const command = new InsertMermaidCommand( fakeEditor( { name: 'paragraph' } ) );

		command.refresh();

		expect( command.isEnabled ).toBe( true );
	} );

	it( 'inserts a diagram with a starter source in split mode', () => {
		const editor = fakeEditor();
		const command = new InsertMermaidCommand( editor );

		command.refresh();
		const mermaidItem = command.execute();

		expect( mermaidItem.name ).toEqual( 'mermaid' );
		expect( mermaidItem.attributes.displayMode ).toEqual( 'split' );
		expect( mermaidItem.attributes.source ).toContain( 'flowchart TB' );
		expect( editor.model.insertContent ).toHaveBeenCalledWith( mermaidItem );
	} );

	it( 'inserts the source of a picked template', () => {
		const editor = fakeEditor();
		const command = new InsertMermaidCommand( editor );

		command.refresh();
		const mermaidItem = command.execute( { source: 'pie title Votes' } );

		expect( mermaidItem.attributes.source ).toEqual( 'pie title Votes' );
	} );
} );
