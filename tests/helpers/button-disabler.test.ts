import { ButtonView, FileDialogButtonView } from '@ckeditor/ckeditor5-ui';
import { Locale } from '@ckeditor/ckeditor5-utils';
import { disableItems, enableItems } from '../../src/helpers/button-disabler';

// Builds a minimal editor stub exposing only what the helper touches:
// editor.ui.view.toolbar.items._items.
const fakeEditorWith = ( items: { isEnabled?: boolean }[] ) => ( {
	ui: {
		view: {
			toolbar: {
				items: { _items: items }
			}
		}
	}
} );

const button = () => {
	const view = new ButtonView( new Locale() );
	view.isEnabled = true;
	return view;
};

const fileDialogButton = () => {
	const view = new FileDialogButtonView( new Locale() );
	view.isEnabled = true;
	return view;
};

describe( 'button-disabler', () => {
	test( 'entering and leaving source mode re-enables the toolbar without crashing', () => {
		const regular = button();
		const upload = fileDialogButton();
		const sourceToggle = button();
		const editor = fakeEditorWith( [ regular, upload, sourceToggle ] );

		disableItems( editor, sourceToggle );
		expect( () => enableItems( editor ) ).not.toThrow();

		expect( regular.isEnabled ).toBe( true );
		expect( upload.isEnabled ).toBe( true );
		expect( sourceToggle.isEnabled ).toBe( true );
	} );

	test( 'disables the file dialog button in source mode', () => {
		const upload = fileDialogButton();
		const sourceToggle = button();
		const editor = fakeEditorWith( [ upload, sourceToggle ] );

		disableItems( editor, sourceToggle );

		expect( upload.isEnabled ).toBe( false );
		expect( sourceToggle.isEnabled ).toBe( true );
	} );

	test( 'keeps a button disabled that was already disabled before source mode', () => {
		const alreadyDisabled = button();
		alreadyDisabled.isEnabled = false;
		const sourceToggle = button();
		const editor = fakeEditorWith( [ alreadyDisabled, sourceToggle ] );

		disableItems( editor, sourceToggle );
		enableItems( editor );

		expect( alreadyDisabled.isEnabled ).toBe( false );
	} );

	test( 'survives repeated source mode round trips', () => {
		const alreadyDisabled = button();
		alreadyDisabled.isEnabled = false;
		const regular = button();
		const sourceToggle = button();
		const editor = fakeEditorWith( [ alreadyDisabled, regular, sourceToggle ] );

		disableItems( editor, sourceToggle );
		enableItems( editor );
		disableItems( editor, sourceToggle );

		expect( regular.isEnabled ).toBe( false );

		enableItems( editor );

		expect( regular.isEnabled ).toBe( true );
		expect( alreadyDisabled.isEnabled ).toBe( false );
	} );

	test( 'leaves items without an isEnabled property alone', () => {
		const separator = {};
		const sourceToggle = button();
		const editor = fakeEditorWith( [ separator, sourceToggle ] );

		disableItems( editor, sourceToggle );
		enableItems( editor );

		expect( Object.prototype.hasOwnProperty.call( separator, 'isEnabled' ) ).toBe( false );
	} );
} );
