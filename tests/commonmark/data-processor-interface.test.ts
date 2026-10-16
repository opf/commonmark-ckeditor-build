import CommonMarkDataProcessor from '../../src/commonmark/commonmarkdataprocessor';
import { createTestEditor } from './_utils/utils';

describe( 'CommonMarkDataProcessor as a DataProcessor', () => {
	it( 'registers raw content matchers on its DOM converter', () => {
		const processor = new CommonMarkDataProcessor( createTestEditor() );
		const register = jest.spyOn( processor._domConverter, 'registerRawContentMatcher' );

		processor.registerRawContentMatcher( { name: 'div', classes: 'raw' } );

		expect( register ).toHaveBeenCalledWith( { name: 'div', classes: 'raw' } );
	} );

	it( 'switches its DOM converter to marked fillers and back', () => {
		const processor = new CommonMarkDataProcessor( createTestEditor() );

		processor.useFillerType( 'marked' );
		expect( processor._domConverter.blockFillerMode ).toEqual( 'markedNbsp' );

		processor.useFillerType( 'default' );
		expect( processor._domConverter.blockFillerMode ).toEqual( 'nbsp' );
	} );
} );
