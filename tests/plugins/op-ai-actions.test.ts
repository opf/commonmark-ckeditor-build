import { EmitterMixin, Locale, ObservableMixin } from '@ckeditor/ckeditor5-utils';
import type { Editor } from '@ckeditor/ckeditor5-core';
import OpAiActions from '../../src/plugins/op-ai-actions/op-ai-actions';
import type { OpAiTextTransformAction, OpResource, OpServices } from '../../src/op-types';

interface FakeEditorOptions {
	services?: Partial<OpServices>;
	resource?: OpResource;
	field?: string;
	maxWidth?: string;
}

class FakeUi extends EmitterMixin() {
	view: { toolbar: ReturnType<typeof fakeToolbar> };

	constructor(toolbar: ReturnType<typeof fakeToolbar>) {
		super();
		this.view = { toolbar };
	}
}

class FakeEditorBase extends ObservableMixin() {}

function fakeToolbar(maxWidth: string) {
	const element = document.createElement('div');
	element.appendChild(document.createElement('div'));
	const maxWidths: string[] = [];
	const tracked: HTMLElement[] = [];

	return {
		element,
		children: new (EmitterMixin())(),
		focusTracker: {
			add: (el: HTMLElement) => tracked.push(el),
			remove: (el: HTMLElement) => tracked.splice(tracked.indexOf(el), 1),
		},
		tracked,
		maxWidths,
		get maxWidth() {
			return maxWidths[maxWidths.length - 1] ?? maxWidth;
		},
		set maxWidth(value: string) {
			maxWidths.push(value);
		},
	};
}

function fakeEditor({ services, resource, field, maxWidth = 'auto' }: FakeEditorOptions = {}) {
	const toolbar = fakeToolbar(maxWidth);
	const editor = new FakeEditorBase() as FakeEditorBase & { isReadOnly: boolean; locale: Locale; config: unknown; ui: FakeUi };

	editor.set('isReadOnly', false);
	editor.locale = new Locale();
	editor.config = {
		_config: {
			openProject: {
				context: { resource, field },
				pluginContext: services ? { services } : undefined,
			},
		},
	};
	editor.ui = new FakeUi(toolbar);

	return { editor: editor as unknown as Editor, observable: editor, toolbar };
}

const i18n = { t: (key: string) => key };
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
const workPackage: OpResource = { id: '42', _type: 'WorkPackage' };
const actions: OpAiTextTransformAction[] = [
	{ id: 1, label: 'Fix grammar', position: 1 },
	{ id: 2, label: 'Make concise', position: 2 },
];

function servicesWith(actionsFor: () => Promise<OpAiTextTransformAction[]>, run = jest.fn()) {
	return { services: { i18n, aiActions: { actionsFor, run } }, run };
}

async function initialised(options: FakeEditorOptions) {
	const fake = fakeEditor(options);
	const plugin = new OpAiActions(fake.editor);

	plugin.init();
	fake.editor.ui.fire('ready');
	await flushPromises();

	return { ...fake, plugin };
}

function openedMenu(plugin: OpAiActions) {
	const dropdownView = plugin.dropdownView!;

	dropdownView.isOpen = true;

	return dropdownView.panelView.element!.querySelectorAll<HTMLButtonElement>('.ck-list__item button');
}

describe('OpAiActions', () => {
	test('adds nothing when the core provides no service', async () => {
		const { toolbar, plugin } = await initialised({});

		expect(toolbar.element.childElementCount).toBe(1);
		expect(plugin.dropdownView).toBeUndefined();
	});

	test('adds nothing while the action list is empty', async () => {
		const { services } = servicesWith(() => Promise.resolve([]));
		const { toolbar, plugin } = await initialised({ services, resource: workPackage, field: 'description' });

		expect(toolbar.element.childElementCount).toBe(1);
		expect(plugin.dropdownView).toBeUndefined();
		expect(toolbar.maxWidths).toEqual([]);
	});

	test('attaches the dropdown behind the toolbar items and runs the chosen action', async () => {
		const actionsFor = jest.fn(() => Promise.resolve(actions));
		const { services, run } = servicesWith(actionsFor);
		const { editor, toolbar, plugin } = await initialised({ services, resource: workPackage, field: 'description' });
		const dropdownView = plugin.dropdownView!;

		expect(actionsFor).toHaveBeenCalledWith(workPackage, 'description');
		expect(toolbar.element.lastElementChild).toBe(dropdownView.element);
		expect(dropdownView.buttonView.icon).toContain('<svg');
		expect(dropdownView.buttonView.withText).toBe(false);
		expect(dropdownView.buttonView.label).toBe('js.editor.ai_actions.caption');

		const buttons = openedMenu(plugin);
		expect([...buttons].map(button => button.textContent!.trim())).toEqual(['Fix grammar', 'Make concise']);
		expect(buttons[0].getAttribute('role')).toBe('menuitem');

		buttons[0].click();
		expect(run).toHaveBeenCalledWith(actions[0], editor, workPackage);
	});

	test('opens its menu towards the toolbar, mirrored for right-to-left languages', async () => {
		const { services } = servicesWith(() => Promise.resolve(actions));
		const { plugin } = await initialised({ services, resource: workPackage, field: 'description' });
		expect(plugin.dropdownView!.panelPosition).toBe('sw');

		const rtl = fakeEditor({ services, resource: workPackage, field: 'description' });
		(rtl.editor as unknown as { locale: Locale }).locale = new Locale({ uiLanguage: 'ar' });
		const rtlPlugin = new OpAiActions(rtl.editor);
		rtlPlugin.init();
		rtl.editor.ui.fire('ready');
		await flushPromises();
		expect(rtlPlugin.dropdownView!.panelPosition).toBe('se');
	});

	test('makes the toolbar regroup and keeps its width limit', async () => {
		const { services } = servicesWith(() => Promise.resolve(actions));
		const { toolbar } = await initialised({ services, resource: workPackage, field: 'description', maxWidth: '320px' });

		expect(toolbar.maxWidths.length).toBeGreaterThanOrEqual(2);
		expect(toolbar.maxWidth).toBe('320px');
	});

	test('is reachable by keyboard', async () => {
		const { services } = servicesWith(() => Promise.resolve(actions));
		const { toolbar, plugin } = await initialised({ services, resource: workPackage, field: 'description' });

		expect(plugin.dropdownView!.buttonView.tabindex).toBe(0);
		expect(toolbar.tracked).toContain(plugin.dropdownView!.element);
	});

	test('closes the menu and refuses to run while the editor is read-only', async () => {
		const { services, run } = servicesWith(() => Promise.resolve(actions));
		const { observable, plugin } = await initialised({ services, resource: workPackage, field: 'description' });
		const buttons = openedMenu(plugin);

		observable.isReadOnly = true;
		expect(plugin.dropdownView!.isOpen).toBe(false);
		expect(plugin.dropdownView!.isEnabled).toBe(false);

		buttons[0].click();
		expect(run).not.toHaveBeenCalled();

		observable.isReadOnly = false;
		expect(plugin.dropdownView!.isEnabled).toBe(true);
	});

	test('is disabled throughout source mode', async () => {
		const { services } = servicesWith(() => Promise.resolve(actions));
		const { editor, plugin } = await initialised({ services, resource: workPackage, field: 'description' });

		editor.fire('op:source-code-enabled');
		expect(plugin.dropdownView!.isEnabled).toBe(false);

		editor.fire('op:source-code-disabled');
		expect(plugin.dropdownView!.isEnabled).toBe(true);
	});

	test('stays disabled when actions resolve during source mode', async () => {
		let resolveActions!: (value: OpAiTextTransformAction[]) => void;
		const { services } = servicesWith(() => new Promise(resolve => { resolveActions = resolve; }));
		const fake = fakeEditor({ services, resource: workPackage, field: 'description' });
		const plugin = new OpAiActions(fake.editor);

		plugin.init();
		fake.editor.ui.fire('ready');
		fake.editor.fire('op:source-code-enabled');
		resolveActions(actions);
		await flushPromises();

		expect(plugin.dropdownView!.isEnabled).toBe(false);
	});

	test('ignores actions that resolve after the plugin was destroyed', async () => {
		let resolveActions!: (value: OpAiTextTransformAction[]) => void;
		const { services } = servicesWith(() => new Promise(resolve => { resolveActions = resolve; }));
		const fake = fakeEditor({ services, resource: workPackage, field: 'description' });
		const plugin = new OpAiActions(fake.editor);

		plugin.init();
		fake.editor.ui.fire('ready');
		plugin.destroy();
		resolveActions(actions);
		await flushPromises();

		expect(fake.toolbar.element.childElementCount).toBe(1);
		expect(plugin.dropdownView).toBeUndefined();
	});

	test('removes the dropdown when destroyed', async () => {
		const { services } = servicesWith(() => Promise.resolve(actions));
		const { toolbar, plugin } = await initialised({ services, resource: workPackage, field: 'description' });
		const element = plugin.dropdownView!.element!;

		plugin.destroy();

		expect(element.isConnected).toBe(false);
		expect(toolbar.tracked).not.toContain(element);
		expect(plugin.dropdownView).toBeUndefined();
	});
});
