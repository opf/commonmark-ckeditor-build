jest.mock( '@ckeditor/ckeditor5-widget', () => ( {
	toWidget: jest.fn( ( element: unknown ) => element ),
	isWidget: jest.fn(),
} ) );

import type { ModelElement, ViewDowncastWriter, ViewElement } from '@ckeditor/ckeditor5-engine';
import { toWidget } from '@ckeditor/ckeditor5-widget';
import OPMacroWpButtonEditing from '../../src/plugins/op-macro-wp-button/op-macro-wp-button-editing';
import OPChildPagesEditing from '../../src/plugins/op-macro-child-pages/op-macro-child-pages-editing';
import { toEmbeddedTableWidget } from '../../src/plugins/op-macro-embedded-table/utils';

const toWidgetMock = toWidget as unknown as jest.Mock;

const writer = {
	createText: jest.fn( ( data: string ) => ( { data } ) ),
	createContainerElement: jest.fn( () => ( {} ) ),
	createPositionAt: jest.fn(),
	insert: jest.fn(),
	setCustomProperty: jest.fn(),
} as unknown as ViewDowncastWriter;

const modelElement = { getAttribute: () => undefined } as unknown as ModelElement;

// The label toWidget() received in its most recent call.
const widgetLabel = () => toWidgetMock.mock.calls[ toWidgetMock.mock.calls.length - 1 ][ 2 ].label;

describe( 'macro widget labels', () => {
	it( 'labels the work package button widget with its text', () => {
		// Only macroLabel() is read from the plugin instance.
		const plugin = { macroLabel: () => 'Create work package' } as unknown as OPMacroWpButtonEditing;

		OPMacroWpButtonEditing.prototype.createMacroViewElement.call( plugin, modelElement, writer );

		expect( widgetLabel() ).toEqual( 'Create work package' );
	} );

	it( 'labels the child pages widget with its text', () => {
		// Only macroLabel() and setPlaceholderContent() are read from the plugin instance.
		const plugin = {
			macroLabel: () => 'Child pages',
			setPlaceholderContent: jest.fn(),
		} as unknown as OPChildPagesEditing;

		OPChildPagesEditing.prototype.createMacroViewElement.call( plugin, modelElement, writer );

		expect( widgetLabel() ).toEqual( 'Child pages' );
	} );

	it( 'labels the embedded table widget with the given text', () => {
		toEmbeddedTableWidget( {} as ViewElement, writer, 'Embedded table' );

		expect( widgetLabel() ).toEqual( 'Embedded table' );
	} );
} );
