import type { Editor } from '@ckeditor/ckeditor5-core';
import type { FileLoader } from '@ckeditor/ckeditor5-upload';
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

		return this.loader.file
			.then(file => {
			return resourceService
				.attachFiles(resource, [file!])
				.toPromise()
				.then((result) => {
					this.editor.model.fire('op:attachment-added', result);

					return this.buildResponse(result[0])
				}).catch((error: unknown) => {
					console.error("Failed upload %O", error);
					// Re-throw so CKEditor's FileRepository marks the loader as failed
					// and removes the placeholder. Previously the error was swallowed,
					// leaving the upload to resolve with `undefined`; CKEditor then
					// crashed reading the (missing) upload result ("unexpected-error").
					throw OpUploadResourceAdapter.errorMessage(error);
				});
		})

	}

	buildResponse(result: OpAttachment) {
		return { default: result._links.staticDownloadLocation.href };
	}

	// Extract the most readable message from whatever the attachments resource
	// service rejected with (a HAL error response, a plain Error, or a string),
	// so CKEditor can surface it instead of an opaque object.
	static errorMessage(error: unknown): string {
		const halError = (error as { error?: { message?: unknown } } | null | undefined)?.error;
		if (halError && typeof halError.message === 'string') {
			return halError.message;
		}

		const message = (error as { message?: unknown } | null | undefined)?.message;
		if (typeof message === 'string') {
			return message;
		}

		return String(error);
	}

    abort() {
		return false;
    }
}
