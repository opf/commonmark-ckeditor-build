import { EmitterMixin, keyCodes, Locale, ObservableMixin } from '@ckeditor/ckeditor5-utils';
import { ButtonView, SplitButtonView, ToolbarView } from '@ckeditor/ckeditor5-ui';
import type { Editor } from '@ckeditor/ckeditor5-core';
import OpAiActionsPlugin from '../../src/plugins/op-ai-actions/op-ai-actions-plugin';
import type { OpAiTextTransformAction, OpResource, OpServices } from '../../src/op-types';

interface FakeEditorOptions {
	services?: Partial<OpServices>;
	uiLanguage?: string;
	shouldGroupWhenFull?: boolean;
}

const i18n = { t: (key: string) => key };
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0));
const workPackage: OpResource = { id: '42', _type: 'WorkPackage' };
const actions: OpAiTextTransformAction[] = [
	{ id: 1, label: 'Fix grammar' },
	{ id: 2, label: 'Make concise' },
];

function toolbarButton(locale: Locale, label: string) {
	const button = new ButtonView(locale);

	button.set({ label, withText: true });

	return button;
}

function fakeEditor({ services, uiLanguage, shouldGroupWhenFull = false }: FakeEditorOptions) {
	const locale = new Locale({ uiLanguage });
	const toolbar = Object.assign(new ToolbarView(locale, { shouldGroupWhenFull }), { regroups: 0 });
	const editor = new (ObservableMixin())() as InstanceType<ReturnType<typeof ObservableMixin>> & Record<string, unknown>;

	toolbar.render();
	document.body.appendChild(toolbar.element!);
	toolbar.items.addMany([toolbarButton(locale, 'Bold'), toolbarButton(locale, 'Italic')]);
	toolbar.on('change:maxWidth', () => toolbar.regroups++);
	editor.set('isReadOnly', false);
	editor.locale = locale;
	editor.config = {
		_config: {
			openProject: {
				context: { resource: workPackage, field: 'description' },
				pluginContext: services ? { services } : undefined,
			},
		},
	};
	editor.ui = Object.assign(new (EmitterMixin())(), { view: { toolbar } });

	return { editor: editor as unknown as Editor, observable: editor, toolbar };
}

function servicesWith(overrides: Partial<NonNullable<OpServices['aiActions']>> = {}) {
	const run = jest.fn();
	const actionsFor = jest.fn(() => Promise.resolve(actions));

	return { services: { i18n, aiActions: { actionsFor, run, ...overrides } }, actionsFor, run };
}

type Initialised = ReturnType<typeof fakeEditor> & { plugin: OpAiActionsPlugin };

// `beforeLoad` runs after the UI is ready, but before the actions arrive.
async function initialised(options: FakeEditorOptions, beforeLoad?: (fake: Initialised) => void) {
	const fake = fakeEditor(options);
	const initialisedFake = { ...fake, plugin: new OpAiActionsPlugin(fake.editor) };

	initialisedFake.plugin.init();
	fake.editor.ui.fire('ready');
	beforeLoad?.(initialisedFake);
	await flushPromises();

	return initialisedFake;
}

function actionButton(plugin: OpAiActionsPlugin) {
	return plugin.dropdownView!.element!.querySelector<HTMLButtonElement>('.ck-splitbutton__action')!;
}

function pressKey(keyCode: number) {
	document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { keyCode, bubbles: true }));
}

function focusedButton(plugin: OpAiActionsPlugin) {
	const focused = document.activeElement!;

	if (focused.classList.contains('ck-splitbutton__arrow')) {
		return 'Assistant arrow';
	}

	return focused === actionButton(plugin) ? 'Assistant' : focused.textContent;
}

function menuButtons(plugin: OpAiActionsPlugin) {
	return plugin.dropdownView!.panelView.element!.querySelectorAll<HTMLButtonElement>('.ck-list__item button');
}

describe('OpAiActionsPlugin', () => {
	beforeEach(() => {
		// The focus cycler skips elements without a layout box, and jsdom lays out nothing.
		jest.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
		window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} } as unknown as typeof ResizeObserver;
	});

	afterEach(() => {
		jest.restoreAllMocks();
		document.body.innerHTML = '';
	});

	test('adds nothing when the core provides no service', async () => {
		const { toolbar, plugin } = await initialised({});

		expect(toolbar.element!.childElementCount).toBe(1);
		expect(plugin.dropdownView).toBeUndefined();
	});

	test('adds nothing while the action list is empty', async () => {
		const { services } = servicesWith({ actionsFor: () => Promise.resolve([]) });
		const { toolbar, plugin } = await initialised({ services });

		expect(toolbar.element!.childElementCount).toBe(1);
		expect(plugin.dropdownView).toBeUndefined();
		expect(toolbar.regroups).toBe(0);
	});

	test('attaches a reachable split button behind the toolbar items that shows the first action', async () => {
		const { services, actionsFor } = servicesWith();
		const { toolbar, plugin } = await initialised({ services });
		const dropdownView = plugin.dropdownView!;

		expect(actionsFor).toHaveBeenCalledWith(workPackage, 'description');
		expect(toolbar.element!.lastElementChild).toBe(dropdownView.element);
		expect(toolbar.regroups).toBe(1);
		expect(dropdownView.buttonView).toBeInstanceOf(SplitButtonView);
		expect(dropdownView.buttonView.icon).toContain('<svg');
		expect(dropdownView.buttonView.withText).toBe(true);
		expect(dropdownView.buttonView.label).toBe('Fix grammar');
		expect(dropdownView.buttonView.tooltip).toBe('js.editor.ai_actions.caption');
		expect(actionButton(plugin).textContent).toContain('Fix grammar');
		expect(actionButton(plugin).tabIndex).toBe(0);
	});

	test('shows the action the service prefers, else the first one', async () => {
		const preferred = await initialised(servicesWith({ defaultAction: list => list[1] }));
		const none = await initialised(servicesWith({ defaultAction: () => undefined }));

		expect(preferred.plugin.dropdownView!.buttonView.label).toBe('Make concise');
		expect(none.plugin.dropdownView!.buttonView.label).toBe('Fix grammar');
	});

	test('runs the shown action from its button and the picked one from the list', async () => {
		const { services, run } = servicesWith();
		const { editor, toolbar, plugin } = await initialised({ services });
		const dropdownView = plugin.dropdownView!;

		actionButton(plugin).click();
		expect(run).toHaveBeenCalledWith(actions[0], editor, workPackage);
		expect(dropdownView.isOpen).toBe(false);

		plugin.dropdownView!.element!.querySelector<HTMLButtonElement>('.ck-splitbutton__arrow')!.click();
		expect(dropdownView.isOpen).toBe(true);

		const buttons = menuButtons(plugin);
		expect([...buttons].map(button => button.textContent!.trim())).toEqual(['Fix grammar', 'Make concise']);
		expect(buttons[1].getAttribute('role')).toBe('menuitem');

		buttons[1].click();
		expect(run).toHaveBeenLastCalledWith(actions[1], editor, workPackage);
		expect(dropdownView.isOpen).toBe(false);
		expect(dropdownView.buttonView.label).toBe('Make concise');
		expect(toolbar.regroups).toBe(2);

		actionButton(plugin).click();
		expect(run).toHaveBeenLastCalledWith(actions[1], editor, workPackage);
	});

	test.each([false, true])('joins the arrow key navigation behind the toolbar items (grouping: %s)', async shouldGroupWhenFull => {
		const { services } = servicesWith();
		const { toolbar, plugin } = await initialised({ services, shouldGroupWhenFull });

		expect(toolbar.focusables.getIndex(plugin.dropdownView!)).toBe(toolbar.focusables.length - 1);

		toolbar.focus();
		expect(focusedButton(plugin)).toBe('Bold');

		const visited = [keyCodes.arrowright, keyCodes.arrowright, keyCodes.arrowright, keyCodes.arrowright, keyCodes.arrowleft]
			.map(keyCode => {
				pressKey(keyCode);
				return focusedButton(plugin);
			});

		expect(visited).toEqual(['Italic', 'Assistant', 'Assistant arrow', 'Bold', 'Assistant']);
	});

	test.each([false, true])('stays the last focusable when the toolbar items change (grouping: %s)', async shouldGroupWhenFull => {
		const { services } = servicesWith();
		const { editor, toolbar, plugin } = await initialised({ services, shouldGroupWhenFull });

		toolbar.items.add(toolbarButton(editor.locale, 'Underline'));

		expect(toolbar.focusables.getIndex(plugin.dropdownView!)).toBe(toolbar.focusables.length - 1);
		expect(toolbar.focusables.length).toBe(4);
	});

	test('opens its menu towards the toolbar, mirrored for right-to-left languages', async () => {
		const { services } = servicesWith();
		const ltr = await initialised({ services });
		const rtl = await initialised({ services, uiLanguage: 'ar' });

		expect(ltr.plugin.dropdownView!.panelPosition).toBe('sw');
		expect(rtl.plugin.dropdownView!.panelPosition).toBe('se');
	});

	test('closes the menu and refuses to run while the editor is read-only', async () => {
		const { services, run } = servicesWith();
		const { observable, plugin } = await initialised({ services });
		plugin.dropdownView!.isOpen = true;
		const buttons = menuButtons(plugin);

		observable.isReadOnly = true;
		expect(plugin.dropdownView!.isOpen).toBe(false);
		expect(plugin.dropdownView!.isEnabled).toBe(false);

		buttons[0].click();
		actionButton(plugin).click();
		expect(run).not.toHaveBeenCalled();

		observable.isReadOnly = false;
		expect(plugin.dropdownView!.isEnabled).toBe(true);
	});

	test('is disabled throughout source mode', async () => {
		const { services } = servicesWith();
		const { editor, plugin } = await initialised({ services });

		editor.fire('op:source-code-enabled');
		expect(plugin.dropdownView!.isEnabled).toBe(false);

		editor.fire('op:source-code-disabled');
		expect(plugin.dropdownView!.isEnabled).toBe(true);
	});

	test('stays disabled when actions resolve during source mode', async () => {
		const { services } = servicesWith();
		const { plugin } = await initialised({ services }, ({ editor }) => editor.fire('op:source-code-enabled'));

		expect(plugin.dropdownView!.isEnabled).toBe(false);
	});

	test('ignores actions that resolve after the plugin was destroyed', async () => {
		const { services } = servicesWith();
		const { toolbar, plugin } = await initialised({ services }, fake => fake.plugin.destroy());

		expect(toolbar.element!.childElementCount).toBe(1);
		expect(plugin.dropdownView).toBeUndefined();
	});

	test('removes the dropdown when destroyed', async () => {
		const { services } = servicesWith();
		const { toolbar, plugin } = await initialised({ services });
		const dropdownView = plugin.dropdownView!;

		plugin.destroy();

		expect(toolbar.element!.childElementCount).toBe(1);
		expect(toolbar.focusables.has(dropdownView)).toBe(false);
	});
});
