export default class OpUploadResourceAdapter {
    constructor(loader, resource) {
        this.loader = loader;
        this.resource = resource;
    }

    upload() {
		const resource = this.resource;
        if (!(resource && resource.uploadAttachments)) {
			const resourceContext = resource ? resource.name : 'Missing context';
            console.warn(`uploadAttachments not present on context: ${resourceContext}`);
            return Promise.reject("You're not allowed to uplod attachments on this resource.");
        }

		return resource
			.uploadAttachments([this.loader.file])
			.then((result) => this.buildResponse(result[0]));
	}

	buildResponse(result) {
		return { default: result.uploadUrl };
	}

    abort() {
		return false;
    }
}
