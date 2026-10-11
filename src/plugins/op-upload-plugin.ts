import { Plugin } from '@ckeditor/ckeditor5-core';
import { FileRepository } from '@ckeditor/ckeditor5-upload';
import { Notification } from '@ckeditor/ckeditor5-ui';
import OpUploadResourceAdapter from './op-upload-resource-adapter';
import {getOPResource} from './op-context/op-context';
import { ImageUpload } from '@ckeditor/ckeditor5-image';

export default class OpUploadPlugin extends Plugin {

    static get requires() {
        return [FileRepository, ImageUpload, Notification];
    }

    static get pluginName() {
        return 'OpUploadPlugin';
    }

    init() {
        this.editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
			const resource = getOPResource(this.editor);
			return new OpUploadResourceAdapter(loader, resource, this.editor);
		}

		// Core reports a failed upload itself. Left unhandled, CKEditor would
		// show the same failure again in a browser alert.
		this.editor.plugins.get('Notification').on('show:warning:upload', (evt) => {
			evt.stop();
		}, { priority: 'high' });
    }
}
