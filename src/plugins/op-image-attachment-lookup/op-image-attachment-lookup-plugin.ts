import { Plugin } from '@ckeditor/ckeditor5-core';
import type {
	DowncastConversionApi,
	DowncastDispatcher,
	ModelElement,
	ViewElement,
} from '@ckeditor/ckeditor5-engine';
import type { EventInfo } from '@ckeditor/ckeditor5-utils';
import type { OpResource } from '../../op-types';

interface SrcAttributeData {
	item: ModelElement;
	attributeNewValue: unknown;
}
import {getOPResource} from '../op-context/op-context';
import {originalSrcAttribute} from '../../commonmark/commonmarkdataprocessor';


export function replaceImageAttachmentsByName(resource: OpResource | undefined) {
	return (dispatcher: DowncastDispatcher) => {
		dispatcher.on('attribute:src:imageBlock', converter, { priority: 'highest' } );
		dispatcher.on('attribute:src:imageInline', converter, { priority: 'highest' } );
	};

	function converter( evt: EventInfo, data: SrcAttributeData, _conversionApi: DowncastConversionApi ) {

		// We do not consume the attribute since we want the regular attribute
		// converter to run as well.
		let src = data.attributeNewValue as string | null;

		// If the resource is not attachable or src has been nulled, do nothing
		// TODO(OP-18993): throws when the editor has no resource.
		if (!(src && resource!.lookupDownloadLocationByName)) {
			return;
		}

		const match = resource!.lookupDownloadLocationByName(src);
		data.attributeNewValue = match || src;
	}
}

export function replaceNamedAttachmentWithUrl(resource: OpResource | undefined) {
	return (dispatcher: DowncastDispatcher) => {
		dispatcher.on('attribute:src:imageBlock', converter, { priority: 'highest' } );
		dispatcher.on('attribute:src:imageInline', converter, { priority: 'highest' } );
	};

	function converter( evt: EventInfo, data: SrcAttributeData, conversionApi: DowncastConversionApi ) {

		// We do not consume the attribute since we want the regular attribute
		// converter to run as well.
		let src = data.attributeNewValue as string | null;

		// If the resource is not attachable or src has been nulled, do nothing
		// TODO(OP-18993): throws when the editor has no resource.
		if (!(src && resource!.lookupDownloadLocationByName)) {
			return;
		}


		const match = resource!.lookupDownloadLocationByName(src);
		data.attributeNewValue = match || src;


		const viewWriter = conversionApi.writer;
		const figure = conversionApi.mapper.toViewElement( data.item );
		let img: ViewElement;

		if (data.item.name === "imageInline") {
			img = figure!;
		} else {
			// A block image is a <figure> whose first child is the <img>.
			img = figure!.getChild( 0 ) as ViewElement;
		}

		if (match) {
			viewWriter.setAttribute(originalSrcAttribute, src, img );
		}
	}
}


export default class OpImageAttachmentLookup extends Plugin {
	static get pluginName() {
		return 'OpImageAttachmentLookup';
	}

	init() {
		const editor = this.editor;
		const conversion = editor.conversion;
		const resource = getOPResource(editor);

		conversion
			.for('editingDowncast')
			.add(replaceImageAttachmentsByName(resource));

		// Temporarily replace the src attribute with data-src attribute to avoid loading
		conversion
			.for('dataDowncast')
			.add(replaceNamedAttachmentWithUrl(resource));

		// Disable the native image size lookup as it breaks this method
		const imageUtils = editor.plugins.get( 'ImageUtils' );

		imageUtils.decorate( 'setImageNaturalSizeAttributes' );

		imageUtils.on( 'setImageNaturalSizeAttributes', ( evt, [ element ] ) => {
			console.log( 'model image element:', { element } );
			evt.stop();
		}, { priority: 'highest' } );
	}

}
