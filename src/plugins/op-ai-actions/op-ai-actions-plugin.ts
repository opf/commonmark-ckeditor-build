import { Plugin } from '@ckeditor/ckeditor5-core';
import { addListToDropdown, createDropdown, SplitButtonView, UIModel } from '@ckeditor/ckeditor5-ui';
import type { DropdownView, ListDropdownItemDefinition, ToolbarView } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';

import sparkleIcon from '../../icons/sparkle.svg';
import { getOPFieldName, getOPI18n, getOPResource, getPluginContext } from '../op-context/op-context';
import { liftPanelToTopLayer } from '../op-toolbar-panels/top-layer-panel';
import type { OpAiTextTransformAction, OpResource, OpServices } from '../../op-types';

type AiActionsService = NonNullable<OpServices['aiActions']>;

/**
 * The Assistant split button at the end of every editor's toolbar. It must
 * stay visible at every toolbar width.
 */
export default class OpAiActionsPlugin extends Plugin {
	public dropdownView?: DropdownView;

	private destroyed = false;

	private releasePanel?: () => void;

	private leaveArrowKeyNavigation?: () => void;

	private resource?: OpResource;

	private loads = 0;

	static get pluginName() {
		return 'OPAiActions' as const;
	}

	init() {
		const editor = this.editor;
		const service = getPluginContext(editor)?.services?.aiActions;

		if (!service) {
			return;
		}

		this.listenTo(editor, 'op:source-code-enabled', () => this.forceDisabled('OPSourceCode'));
		this.listenTo(editor, 'op:source-code-disabled', () => this.clearForceDisabled('OPSourceCode'));
		this.listenTo(editor.ui, 'ready', () => void this.loadActions(service));
		// The core fires this when the actions depend on values the user changes in a form around the editor.
		this.listenTo(editor, 'op:ai-actions:context-changed', (evt, { resource }: { resource?: OpResource } = {}) => {
			this.resource = resource;
			void this.loadActions(service);
		});
	}

	override destroy() {
		this.destroyed = true;
		super.destroy();
		this.detachDropdown();
	}

	private currentResource() {
		return this.resource ?? getOPResource(this.editor);
	}

	private async loadActions(service: AiActionsService) {
		const editor = this.editor;
		const load = ++this.loads;
		const resource = this.currentResource();
		const actions = await service.actionsFor(resource, getOPFieldName(editor)).catch(() => []);
		const toolbar = editor.ui.view.toolbar;

		// A later load answers for a newer context.
		if (this.destroyed || load !== this.loads) {
			return;
		}

		const replaced = this.detachDropdown();
		if (actions.length > 0 && toolbar?.element) {
			this.dropdownView = this.attachDropdown(service, actions, resource, toolbar);
		} else if (replaced && toolbar) {
			this.regroup(toolbar);
		}
	}

	private detachDropdown() {
		const dropdownView = this.dropdownView;
		const toolbar = this.editor.ui.view.toolbar;

		if (!dropdownView) {
			return false;
		}

		// Stops listening to the focusables first, so removing the dropdown below does not append it again.
		this.leaveArrowKeyNavigation?.();
		this.releasePanel?.();
		if (toolbar?.focusables.has(dropdownView)) {
			toolbar.focusables.remove(dropdownView);
		}
		toolbar?.focusTracker.remove(dropdownView);
		dropdownView.element?.remove();
		dropdownView.destroy();
		this.dropdownView = undefined;

		return true;
	}

	// The toolbar regroups its items only when it is resized or when its maxWidth changes.
	private regroup(toolbar: ToolbarView) {
		toolbar.fire('change:maxWidth', 'maxWidth', toolbar.maxWidth, toolbar.maxWidth);
	}

	private attachDropdown(
		service: AiActionsService,
		actions: OpAiTextTransformAction[],
		resource: OpResource | undefined,
		toolbar: ToolbarView,
	) {
		const editor = this.editor;
		const caption = getOPI18n(editor).t('js.editor.ai_actions.caption');
		const splitButtonView = new SplitButtonView(editor.locale);
		const dropdownView = createDropdown(editor.locale, splitButtonView);
		let shownAction: OpAiTextTransformAction;

		const show = (action: OpAiTextTransformAction) => {
			shownAction = action;
			dropdownView.buttonView.label = action.label;
			this.regroup(toolbar);
		};
		const run = (action: OpAiTextTransformAction) => {
			if (dropdownView.isEnabled) {
				// The resource the actions were listed for, so a click during a reload cannot mix two contexts.
				void service.run(action, editor, resource);
			}
		};

		addListToDropdown(dropdownView, new Collection(actions.map((action): ListDropdownItemDefinition => ({
			type: 'button',
			model: new UIModel({ action, label: action.label, withText: true, role: 'menuitem' }),
		}))), { role: 'menu', ariaLabel: caption });
		dropdownView.set('class', 'op-ai-actions');
		// The button sits at the toolbar's end; a panel growing outwards would leave the editor.
		dropdownView.panelPosition = editor.locale.uiLanguageDirection === 'rtl' ? 'se' : 'sw';
		this.releasePanel = liftPanelToTopLayer(dropdownView);
		dropdownView.buttonView.set({ icon: sparkleIcon, withText: true, tooltip: true, tabindex: 0 });
		// The arrow opens the menu, so it keeps the caption as its tooltip and accessible name.
		splitButtonView.arrowView.unbind('label', 'tooltip');
		splitButtonView.arrowView.set({ label: caption, tooltip: true });
		dropdownView.bind('isEnabled').to(this, 'isEnabled', editor, 'isReadOnly', (enabled, readOnly) => enabled && !readOnly);
		dropdownView.on('change:isEnabled', (evt, name, isEnabled) => {
			if (!isEnabled) {
				dropdownView.isOpen = false;
			}
		});

		dropdownView.buttonView.on('execute', () => run(shownAction));
		// Before the dropdown closes and focuses its button, which shows the tooltip with the label it has then.
		dropdownView.on('execute', evt => {
			const { action } = evt.source as { action?: OpAiTextTransformAction };

			if (action) {
				show(action);
				run(action);
			}
		}, { priority: 'high' });

		// Outside the toolbar's items, so the toolbar never groups it into its overflow menu.
		dropdownView.render();
		toolbar.element!.appendChild(dropdownView.element!);
		this.joinArrowKeyNavigation(toolbar, dropdownView);
		show(service.defaultAction?.(actions) ?? actions[0]);

		return dropdownView;
	}

	private joinArrowKeyNavigation(toolbar: ToolbarView, dropdownView: DropdownView) {
		const focusables = toolbar.focusables;
		// The toolbar refills its focusables whenever it regroups its items.
		const keepLast = () => {
			if (focusables.last === dropdownView) {
				return;
			}

			if (focusables.has(dropdownView)) {
				// The change event of the removal appends it again.
				focusables.remove(dropdownView);
			} else {
				focusables.add(dropdownView);
			}
		};

		toolbar.focusTracker.add(dropdownView);
		this.listenTo(focusables, 'change', keepLast);
		this.leaveArrowKeyNavigation = () => this.stopListening(focusables, 'change', keepLast);
		keepLast();
	}
}
