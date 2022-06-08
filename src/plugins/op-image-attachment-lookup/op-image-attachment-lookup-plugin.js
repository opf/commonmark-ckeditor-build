import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {getOPResource} from '../op-context/op-context';
import {originalSrcAttribute} from '../../commonmark/commonmarkdataprocessor';


export function replaceImageAttachmentsByName(resource) {
	return dispatcher => {
		dispatcher.on('attribute:src:imageBlock', converter, { priority: 'highest' } );
		dispatcher.on('attribute:src:imageInline', converter, { priority: 'highest' } );
	};

	function converter( evt, data, conversionApi ) {

		// We do not consume the attribute since we want the regular attribute
		// converter to run as well.
		let src = data.attributeNewValue;

		// If the resource is not attachable or src has been nulled, do nothing
		if (!(src && resource.lookupDownloadLocationByName)) {
			return;
		}

		const match = resource.lookupDownloadLocationByName(src);
		data.attributeNewValue = match || src;
	}
}

export function replaceNamedAttachmentWithUrl(resource) {
	return dispatcher => {
		dispatcher.on('attribute:src:imageBlock', converter, { priority: 'highest' } );
		dispatcher.on('attribute:src:imageInline', converter, { priority: 'highest' } );
	};

	function converter( evt, data, conversionApi ) {

		// We do not consume the attribute since we want the regular attribute
		// converter to run as well.
		let src = data.attributeNewValue;

		// If the resource is not attachable or src has been nulled, do nothing
		if (!(src && resource.lookupDownloadLocationByName)) {
			return;
		}


		const match = resource.lookupDownloadLocationByName(src);
		data.attributeNewValue = match || src;


		const viewWriter = conversionApi.writer;
		const figure = conversionApi.mapper.toViewElement( data.item );
		const img = figure.getChild( 0 );

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
	}

}
