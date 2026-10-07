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
				});
		})

	}

	buildResponse(result) {
		return { default: result._links.staticDownloadLocation.href };
	}

    abort() {
		return false;
    }
}
