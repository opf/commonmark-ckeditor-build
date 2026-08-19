import {dropdownPanelPosition} from '../../src/plugins/op-content-revisions/dropdown-position.js';

describe( 'dropdownPanelPosition', () => {
	test( 'opens towards the right when the button is in the left half', () => {
		const toolbarRect = { left: 100, width: 400 };
		const buttonRect = { left: 120, width: 40 };

		expect( dropdownPanelPosition( buttonRect, toolbarRect ) ).toBe( 'se' );
	} );

	test( 'opens towards the left when the button is in the right half', () => {
		const toolbarRect = { left: 100, width: 400 };
		const buttonRect = { left: 420, width: 40 };

		expect( dropdownPanelPosition( buttonRect, toolbarRect ) ).toBe( 'sw' );
	} );
} );
