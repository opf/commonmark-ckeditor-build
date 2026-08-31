import { Locale, EventInfo } from '@ckeditor/ckeditor5-utils';
import OpAiActionsPlugin from '../../src/plugins/op-ai-actions-plugin';

// Builds a minimal editor stub exposing only what the plugin touches:
// the openProject config entry and the component factory registry.
const fakeEditor = ({ services, resource, field } = {}) => {
	const components = {};

	return {
		config: {
			_config: {
				openProject: {
					context: { resource, field },
					pluginContext: services ? { services } : undefined,
				},
			},
		},
		ui: {
			componentFactory: {
				add: (name, callback) => {
					components[name] = callback;
				},
			},
		},
		components,
	};
};

const i18n = { t: key => key };

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));

describe('OpAiActionsPlugin', () => {
	test('registers no component when the core provides no service', () => {
		const editor = fakeEditor({});

		new OpAiActionsPlugin(editor).init();

		expect(Object.keys(editor.components)).toEqual([]);
	});

	test('keeps the dropdown hidden when the action list is empty', async () => {
		const services = { i18n, aiActions: { actionsFor: () => Promise.resolve([]), run: jest.fn() } };
		const editor = fakeEditor({ services, resource: { id: '42' }, field: 'description' });

		new OpAiActionsPlugin(editor).init();
		const dropdownView = editor.components.opAiActions(new Locale());
		await flushPromises();

		expect(dropdownView.class).toContain('ck-hidden');
	});

	test('shows the dropdown and delegates the selected action to the service', async () => {
		const run = jest.fn();
		const actions = [
			{ id: 1, label: 'Fix grammar', position: 1 },
			{ id: 2, label: 'Make concise', position: 2 },
		];
		const resource = { id: '42' };
		const actionsFor = jest.fn(() => Promise.resolve(actions));
		const services = { i18n, aiActions: { actionsFor, run } };
		const editor = fakeEditor({ services, resource, field: 'description' });

		new OpAiActionsPlugin(editor).init();
		const dropdownView = editor.components.opAiActions(new Locale());
		await flushPromises();

		expect(actionsFor).toHaveBeenCalledWith(resource, 'description');
		expect(dropdownView.class).not.toContain('ck-hidden');

		// A click on a list item arrives as a delegated execute event whose
		// source is the item view carrying the bound action.
		dropdownView.fire(new EventInfo({ action: actions[0] }, 'execute'));

		expect(run).toHaveBeenCalledWith(actions[0], editor, resource);
	});
});
