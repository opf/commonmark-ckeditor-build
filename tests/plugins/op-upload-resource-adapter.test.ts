import type { Editor } from '@ckeditor/ckeditor5-core';
import type { FileLoader } from '@ckeditor/ckeditor5-upload';
import { EMPTY, of, throwError } from 'rxjs';
import type { Observable } from 'rxjs';
import type { OpAttachment, OpResource } from '../../src/op-types';
import OpUploadResourceAdapter from '../../src/plugins/op-upload-resource-adapter';

const resource: OpResource = { id: '42', _type: 'WorkPackage' };
const file = new File(['image'], 'upload.png', { type: 'image/png' });

function attachment(href: string): OpAttachment {
	return { _links: { staticDownloadLocation: { href } } };
}

function setup(upload: Observable<OpAttachment[]>) {
	const attachFiles = jest.fn(() => upload);
	const fire = jest.fn();
	const editor = {
		config: { _config: { openProject: { pluginContext: { services: { attachmentsResourceService: { attachFiles } } } } } },
		model: { fire },
	} as unknown as Editor;
	const loader = { file: Promise.resolve(file) } as FileLoader;

	return { adapter: new OpUploadResourceAdapter(loader, resource, editor), attachFiles, fire };
}

afterEach(() => jest.restoreAllMocks());

it('uses the final attachment result from an observable without toPromise', async () => {
	const attachments = [attachment('/final.png'), attachment('/other.png')];
	const upload = of([attachment('/first.png')], attachments);
	Object.defineProperty(upload, 'toPromise', { value: undefined });
	const { adapter, attachFiles, fire } = setup(upload);

	await expect(adapter.upload()).resolves.toEqual({ default: '/final.png' });
	expect(attachFiles).toHaveBeenCalledTimes(1);
	expect(attachFiles).toHaveBeenCalledWith(resource, [file]);
	expect(fire).toHaveBeenCalledTimes(1);
	expect(fire).toHaveBeenCalledWith('op:attachment-added', attachments);
});

it('logs upload errors without emitting an attachment event', async () => {
	const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
	const error = new Error('upload failed');
	const { adapter, fire } = setup(throwError(() => error));

	await expect(adapter.upload()).resolves.toBeUndefined();
	expect(logError).toHaveBeenCalledWith('Failed upload %O', error);
	expect(fire).not.toHaveBeenCalled();
});

it('still fires op:attachment-added on empty completion so core can clear the drop overlay', async () => {
	const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
	const { adapter, fire } = setup(EMPTY);

	await expect(adapter.upload()).resolves.toBeUndefined();
	expect(logError).toHaveBeenCalledTimes(1);
	expect(fire).toHaveBeenCalledWith('op:attachment-added', undefined);
});
