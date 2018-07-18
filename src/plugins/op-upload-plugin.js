import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import FileRepository from '@ckeditor/ckeditor5-upload/src/filerepository';
import OpUploadResourceAdapter from './op-upload-resource-adapter';
import {getOPContext} from './op-context/op-context';
import ImageUpload from '@ckeditor/ckeditor5-image/src/imageupload';

export default class OpUploadPlugin extends Plugin {

    static get requires() {
        return [FileRepository, ImageUpload];
    }

    static get pluginName() {
        return 'OpUploadPlugin';
    }

    init() {
        this.editor.plugins.get('FileRepository').createUploadAdapter = (loader) => {
			const resource = getOPContext(this.editor);
			return new OpUploadResourceAdapter(loader, resource);
		}
    }
}
