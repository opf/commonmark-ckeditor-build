import { Plugin } from '@ckeditor/ckeditor5-core';
import { FileRepository } from '@ckeditor/ckeditor5-upload';
import { Notification } from '@ckeditor/ckeditor5-ui';
import OpUploadResourceAdapter from './op-upload-resource-adapter';
import {getOPResource, getOPService} from './op-context/op-context';
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

		// Left unhandled, CKEditor would show a failed upload in a browser
		// alert. Report it through core's notifications instead.
		this.editor.plugins.get('Notification').on('show:warning:upload', (evt, data: { message: string }) => {
			getOPService(this.editor, 'notifications').addError(data.message);
			evt.stop();
		}, { priority: 'high' });
    }
}
