import { get } from '@rails/request.js';
import { userMentions } from "../../src/mentions/user-mentions.js";

jest.mock('@rails/request.js', () => ({ get: jest.fn() }));

function buildEditor({ resource, principalsUrl = '/api/v3/principals', disabledMentions = [] }) {
	const principals = jest.fn(() => principalsUrl);
	const editor = {
		config: {
			get: (key) => (key === 'disabledMentions' ? disabledMentions : undefined),
			_config: {
				openProject: {
					context: { resource },
					pluginContext: {
						services: {
							pathHelperService: { api: { v3: { principals } } },
							apiV3Service: { users: { segment: 'users' } },
						},
					},
				},
			},
		},
	};

	return { editor, principals };
}

describe('userMentions', () => {
	beforeEach(() => {
		window.OpenProject = { urlRoot: '' };
		get.mockResolvedValue({
			json: Promise.resolve({
				_embedded: { elements: [{ _type: 'User', id: 1, name: 'Ada' }, { _type: 'User', id: 1, name: 'Ada' }] },
			}),
		});
	});

	test('it fetches principals for a work package', async () => {
		const resource = { _type: 'WorkPackage' };
		const { editor, principals } = buildEditor({ resource });

		const result = await userMentions.call(editor, 'ad');

		expect(principals).toHaveBeenCalledWith(resource, 'ad');
		expect(result).toEqual([
			{ type: 'user', id: '@1', text: '@Ada', link: '/users/1', dataId: 1, name: 'Ada' },
		]);
	});

	test('it unwraps an activity comment to its work package', async () => {
		const workPackage = { _type: 'WorkPackage' };
		const { editor, principals } = buildEditor({
			resource: { _type: 'Activity::Comment', $embedded: { workPackage } },
		});

		await userMentions.call(editor, 'ad');

		expect(principals).toHaveBeenCalledWith(workPackage, 'ad');
	});

	test('it fetches principals for any resource the path helper supports', async () => {
		const resource = { _type: 'Post' };
		const { editor, principals } = buildEditor({ resource, principalsUrl: '/api/v3/principals?post' });

		const result = await userMentions.call(editor, 'ad');

		expect(principals).toHaveBeenCalledWith(resource, 'ad');
		expect(get).toHaveBeenCalledWith('/api/v3/principals?post', expect.any(Object));
		expect(result).toHaveLength(1);
	});

	test('it returns no mentions when the path helper has no url for the resource', () => {
		const { editor } = buildEditor({ resource: { _type: 'WikiPage' }, principalsUrl: null });

		expect(userMentions.call(editor, 'ad')).toEqual([]);
		expect(get).not.toHaveBeenCalled();
	});

	test('it returns no mentions without a resource', () => {
		const { editor, principals } = buildEditor({ resource: undefined });

		expect(userMentions.call(editor, 'ad')).toEqual([]);
		expect(principals).not.toHaveBeenCalled();
	});

	test('it returns no mentions when user mentions are disabled', () => {
		const { editor, principals } = buildEditor({ resource: { _type: 'WorkPackage' }, disabledMentions: ['user'] });

		expect(userMentions.call(editor, 'ad')).toEqual([]);
		expect(principals).not.toHaveBeenCalled();
	});
});
