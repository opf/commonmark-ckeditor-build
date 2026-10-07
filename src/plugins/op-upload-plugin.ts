import { Plugin } from '@ckeditor/ckeditor5-core';
import { FileRepository } from '@ckeditor/ckeditor5-upload';
import type { UploadAdapter } from '@ckeditor/ckeditor5-upload';
import OpUploadResourceAdapter from './op-upload-resource-adapter';
import {getOPResource} from './op-context/op-context';
import { ImageUpload } from '@ckeditor/ckeditor5-image';

export default class OpUploadPlugin extends Plugin {

    static get requires() {
        return [FileRepository, ImageUpload];
    }

    static get pluginName() {
        return 'OpUploadPlugin';
    }

    init() {
        this.editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
			const resource = getOPResource(this.editor);
			// TODO(OP-18993): upload() resolves with undefined when the request fails,
			// where UploadAdapter requires a response or a rejection.
			return new OpUploadResourceAdapter(loader, resource, this.editor) as unknown as UploadAdapter;
		}
    }
}
