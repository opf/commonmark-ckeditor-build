import {getOPService} from './op-context/op-context';
import type {Editor} from "@ckeditor/ckeditor5-core";
import type {FileLoader} from "@ckeditor/ckeditor5-upload";
import type {UploadResponse} from "@ckeditor/ckeditor5-upload";

type OpenProjectResource = Record<string, string | number | boolean | null | undefined | object>;

interface UploadResourceService {
  attachFiles(resource:OpenProjectResource, files:File[]):{
    toPromise():Promise<AttachmentUploadResult[]>;
  };
}

interface AttachmentUploadResult {
  _links:{
    staticDownloadLocation:{
      href:string;
    };
  };
}

export default class OpUploadResourceAdapter {
    loader:FileLoader;
    resource:OpenProjectResource | null;
    editor:Editor;

    constructor(loader:FileLoader, resource:OpenProjectResource | null, editor:Editor) {
        this.loader = loader;
        this.resource = resource;
        this.editor = editor;
    }

    upload():Promise<UploadResponse> {
		const resource = this.resource;
		const resourceService = getOPService(this.editor, 'attachmentsResourceService') as UploadResourceService;

        if (!resource) {
            console.warn(`resource not available in this CKEditor instance`);
            return Promise.reject(new Error("Not possible to upload attachments without resource"));
		}

		return this.loader.file
			.then((file) => {
			if (!file) {
				throw new Error("Not possible to upload empty file payload");
			}

			return resourceService
				.attachFiles(resource, [file])
				.toPromise()
				.then((result) => {
					if (!result[0]) {
						throw new Error("Attachment upload succeeded without a response payload");
					}

					this.editor.model.fire('op:attachment-added', result);

					return this.buildResponse(result[0])
				});
		})
		.catch((error:Error) => {
			console.error("Failed upload %O", error);
			throw error;
		});

	}

	buildResponse(result:AttachmentUploadResult):UploadResponse {
		return { default: result._links.staticDownloadLocation.href };
	}

    abort() {
		return false;
    }
}
