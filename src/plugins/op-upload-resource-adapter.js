import {getOPService} from './op-context/op-context';

export default class OpUploadResourceAdapter {
    constructor(loader, resource, editor) {
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
				.attachFiles(resource, [file])
				.toPromise()
				.then((result) => {
					this.editor.model.fire('op:attachment-added', result);

					return this.buildResponse(result[0])
				}).catch((error) => {
					console.error("Failed upload %O", error);
					// Re-throw so CKEditor's FileRepository marks the loader as failed
					// and removes the placeholder. Previously the error was swallowed,
					// leaving the upload to resolve with `undefined`; CKEditor then
					// crashed reading the (missing) upload result ("unexpected-error").
					throw OpUploadResourceAdapter.errorMessage(error);
				});
		})

	}

	buildResponse(result) {
		return { default: result._links.staticDownloadLocation.href };
	}

	// Extract the most readable message from whatever the attachments resource
	// service rejected with (a HAL error response, a plain Error, or a string),
	// so CKEditor can surface it instead of an opaque object.
	static errorMessage(error) {
		const halError = error && error.error;
		if (halError && typeof halError.message === 'string') {
			return halError.message;
		}

		if (error && typeof error.message === 'string') {
			return error.message;
		}

		return String(error);
	}

    abort() {
		return false;
    }
}
