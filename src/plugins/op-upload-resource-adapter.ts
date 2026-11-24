import type { Editor } from '@ckeditor/ckeditor5-core';
import type { FileLoader } from '@ckeditor/ckeditor5-upload';
import { lastValueFrom } from 'rxjs';
import type { OpAttachment, OpResource } from '../op-types';
import {getOPService} from './op-context/op-context';

export default class OpUploadResourceAdapter {
    declare loader: FileLoader;
    declare resource: OpResource | undefined;
    declare editor: Editor;

    constructor(loader: FileLoader, resource: OpResource | undefined, editor: Editor) {
        this.loader = loader;
        this.resource = resource;
        this.editor = editor;
    }

    upload() {
		const resource = this.resource;
		const resourceService = getOPService(this.editor, 'attachmentsResourceService');

        if (!resource) {
            console.warn(`resource not available in this CKEditor instance`);
            return Promise.reject("Not possible to upload attachments without resource");
		}

		return this.loader.file.then(file =>
			lastValueFrom(resourceService.attachFiles(resource, [file!]), { defaultValue: undefined })
				.then(result => {
					// Fire before the result check: core's op-ckeditor listener clears
					// the drop overlay on this event, even after an empty upload.
					this.editor.model.fire('op:attachment-added', result);

					const attachment = result?.[0];
					if (!attachment) {
						throw new Error('Attachment upload completed without an attachment');
					}

					return this.buildResponse(attachment);
				})
				.catch(error => {
					console.error("Failed upload %O", error);
				})
		);
	}

	buildResponse(result: OpAttachment) {
		return { default: result._links.staticDownloadLocation.href };
	}

    abort() {
		return false;
    }
}
