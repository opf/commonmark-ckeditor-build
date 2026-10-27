import type { DowncastDispatcher } from '@ckeditor/ckeditor5-engine';
import {
	replaceImageAttachmentsByName,
	replaceNamedAttachmentWithUrl,
} from '../../src/plugins/op-image-attachment-lookup/op-image-attachment-lookup-plugin';
import type { OpResource } from '../../src/op-types';

interface SrcData {
	item: { name: string };
	attributeNewValue: unknown;
}

type Converter = ( evt: unknown, data: SrcData, conversionApi: unknown ) => void;

// Both factories register the same converter for block and inline images.
// A dispatcher that records what is registered lets us call it directly.
function converterOf( register: ( dispatcher: DowncastDispatcher ) => void ): Converter {
	const converters: Converter[] = [];
	const dispatcher = {
		on: ( _event: string, converter: Converter ) => converters.push( converter ),
	} as unknown as DowncastDispatcher;

	register( dispatcher );

	return converters[ 0 ];
}

function srcData( src: string ): SrcData {
	return { item: { name: 'imageInline' }, attributeNewValue: src };
}

describe( 'OpImageAttachmentLookup converters', () => {
	describe( 'without a resource', () => {
		it( 'leaves the src alone in the editing downcast', () => {
			const convert = converterOf( replaceImageAttachmentsByName( undefined ) );
			const data = srcData( '/not_exist' );

			expect( () => convert( {}, data, {} ) ).not.toThrow();
			expect( data.attributeNewValue ).toEqual( '/not_exist' );
		} );

		it( 'leaves the src alone in the data downcast', () => {
			const convert = converterOf( replaceNamedAttachmentWithUrl( undefined ) );
			const data = srcData( '/not_exist' );

			expect( () => convert( {}, data, {} ) ).not.toThrow();
			expect( data.attributeNewValue ).toEqual( '/not_exist' );
		} );
	} );

	describe( 'with a resource that cannot hold attachments', () => {
		const resource: OpResource = { _type: 'Project' };

		it( 'leaves the src alone', () => {
			const convert = converterOf( replaceImageAttachmentsByName( resource ) );
			const data = srcData( 'picture.png' );

			expect( () => convert( {}, data, {} ) ).not.toThrow();
			expect( data.attributeNewValue ).toEqual( 'picture.png' );
		} );
	} );

	describe( 'with a resource that holds attachments', () => {
		it( 'replaces an attachment name with its download location', () => {
			const resource: OpResource = {
				_type: 'WorkPackage',
				lookupDownloadLocationByName: ( name ) => ( name === 'picture.png' ? '/api/v3/attachments/7/content' : null ),
			};
			const convert = converterOf( replaceImageAttachmentsByName( resource ) );
			const data = srcData( 'picture.png' );

			convert( {}, data, {} );

			expect( data.attributeNewValue ).toEqual( '/api/v3/attachments/7/content' );
		} );

		it( 'keeps a src that matches no attachment', () => {
			const resource: OpResource = {
				_type: 'WorkPackage',
				lookupDownloadLocationByName: () => null,
			};
			const convert = converterOf( replaceImageAttachmentsByName( resource ) );
			const data = srcData( 'https://example.com/a.png' );

			convert( {}, data, {} );

			expect( data.attributeNewValue ).toEqual( 'https://example.com/a.png' );
		} );
	} );
} );
