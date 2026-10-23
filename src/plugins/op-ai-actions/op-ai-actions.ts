import { Plugin } from '@ckeditor/ckeditor5-core';
import { addListToDropdown, createDropdown, SplitButtonView, UIModel } from '@ckeditor/ckeditor5-ui';
import type { DropdownView, ListDropdownItemDefinition, ToolbarView } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';

import sparkleIcon from '../../icons/sparkle.svg';
import { getOPFieldName, getOPI18n, getOPResource, getPluginContext } from '../op-context/op-context';
import type { OpAiTextTransformAction, OpServices } from '../../op-types';

type AiActionsService = NonNullable<OpServices['aiActions']>;

/**
 * The Assistant split button of the work package description editor. It must
 * stay visible at every toolbar width.
 */
export default class OpAiActions extends Plugin {
	public dropdownView?: DropdownView;

	private destroyed = false;

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
	}

	override destroy() {
		this.destroyed = true;
		this.dropdownView?.element?.remove();
		this.dropdownView?.destroy();
		super.destroy();
	}

	private async loadActions(service: AiActionsService) {
		const editor = this.editor;
		const actions = await service.actionsFor(getOPResource(editor), getOPFieldName(editor)).catch(() => []);
		const toolbar = editor.ui.view.toolbar;

		if (!this.destroyed && actions.length > 0 && toolbar?.element) {
			this.dropdownView = this.attachDropdown(service, actions, toolbar);
		}
	}

	private attachDropdown(service: AiActionsService, actions: OpAiTextTransformAction[], toolbar: ToolbarView) {
		const editor = this.editor;
		const caption = getOPI18n(editor).t('js.editor.ai_actions.caption');
		const dropdownView = createDropdown(editor.locale, SplitButtonView);
		let shownAction: OpAiTextTransformAction;

		const show = (action: OpAiTextTransformAction) => {
			shownAction = action;
			dropdownView.buttonView.label = action.label;
			// The toolbar regroups its items only when it is resized or when its maxWidth changes.
			toolbar.fire('change:maxWidth', 'maxWidth', toolbar.maxWidth, toolbar.maxWidth);
		};
		const run = (action: OpAiTextTransformAction) => {
			if (dropdownView.isEnabled) {
				void service.run(action, editor, getOPResource(editor));
			}
		};

		addListToDropdown(dropdownView, new Collection(actions.map((action): ListDropdownItemDefinition => ({
			type: 'button',
			model: new UIModel({ action, label: action.label, withText: true, role: 'menuitem' }),
		}))), { role: 'menu', ariaLabel: caption });
		dropdownView.set('class', 'op-ai-actions');
		// The button sits at the toolbar's end; a panel growing outwards is clipped by the editor's pane.
		dropdownView.panelPosition = editor.locale.uiLanguageDirection === 'rtl' ? 'se' : 'sw';
		dropdownView.buttonView.set({ icon: sparkleIcon, withText: true, tooltip: caption, tabindex: 0 });
		dropdownView.bind('isEnabled').to(this, 'isEnabled', editor, 'isReadOnly', (enabled, readOnly) => enabled && !readOnly);
		dropdownView.on('change:isEnabled', (evt, name, isEnabled) => {
			if (!isEnabled) {
				dropdownView.isOpen = false;
			}
		});

		dropdownView.buttonView.on('execute', () => run(shownAction));
		dropdownView.on('execute', evt => {
			const { action } = evt.source as { action?: OpAiTextTransformAction };

			if (action) {
				show(action);
				run(action);
			}
		});

		// Outside the toolbar's items, so the toolbar never groups it into its overflow menu.
		dropdownView.render();
		toolbar.element!.appendChild(dropdownView.element!);
		show(service.defaultAction?.(actions) ?? actions[0]);

		return dropdownView;
	}
}
