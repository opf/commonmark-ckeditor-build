import { Plugin } from '@ckeditor/ckeditor5-core';
import type { Editor } from '@ckeditor/ckeditor5-core';
import { addListToDropdown, createDropdown, UIModel } from '@ckeditor/ckeditor5-ui';
import type { DropdownView, ListDropdownItemDefinition, ToolbarView } from '@ckeditor/ckeditor5-ui';
import { Collection } from '@ckeditor/ckeditor5-utils';

import sparkleIcon from '../../icons/sparkle.svg';
import { getOPFieldName, getOPResource, getPluginContext } from '../op-context/op-context';
import type { OpAiTextTransformAction, OpServices } from '../../op-types';

type AiActionsService = NonNullable<OpServices['aiActions']>;

/**
 * The Assistant dropdown of the work package description editor. It must stay
 * visible at every toolbar width.
 */
export default class OpAiActions extends Plugin {
	public dropdownView?: DropdownView;

	private destroyed = false;

	private sourceMode = false;

	static get pluginName() {
		return 'OPAiActions' as const;
	}

	init() {
		const editor = this.editor;
		const service = aiActionsService(editor);

		if (!service) {
			return;
		}

		this.listenTo(editor, 'op:source-code-enabled', () => this.setSourceMode(true));
		this.listenTo(editor, 'op:source-code-disabled', () => this.setSourceMode(false));
		this.listenTo(editor, 'change:isReadOnly', () => this.updateEnabled());
		this.listenTo(editor.ui, 'ready', () => {
			void this.loadActions(service);
		});
	}

	override destroy() {
		this.destroyed = true;
		this.detachDropdown();
		super.destroy();
	}

	private async loadActions(service: AiActionsService) {
		const editor = this.editor;
		const actions = await service.actionsFor(getOPResource(editor), getOPFieldName(editor)).catch(() => []);
		const toolbar = editor.ui.view.toolbar;

		if (this.destroyed || actions.length === 0 || !toolbar?.element) {
			return;
		}

		this.dropdownView = this.createDropdownView(service, actions);
		this.attachToToolbar(toolbar, this.dropdownView);
		this.updateEnabled();
	}

	private createDropdownView(service: AiActionsService, actions: OpAiTextTransformAction[]): DropdownView {
		const editor = this.editor;
		const caption = getPluginContext(editor)!.services.i18n.t('js.editor.ai_actions.caption');
		const dropdownView = createDropdown(editor.locale);
		const collection = new Collection<ListDropdownItemDefinition>();

		for (const action of actions) {
			collection.add({
				type: 'button',
				model: new UIModel({ action, label: action.label, withText: true, role: 'menuitem' }),
			});
		}

		addListToDropdown(dropdownView, collection, { role: 'menu', ariaLabel: caption });
		dropdownView.set('class', 'op-ai-actions');
		dropdownView.buttonView.set({
			label: caption,
			icon: sparkleIcon,
			withText: false,
			tooltip: true,
			tabindex: 0,
		});

		this.listenTo(dropdownView, 'execute', evt => {
			const { action } = evt.source as { action?: OpAiTextTransformAction };

			if (action && dropdownView.isEnabled) {
				void service.run(action, editor, getOPResource(editor));
			}
		});

		return dropdownView;
	}

	private attachToToolbar(toolbar: ToolbarView, dropdownView: DropdownView) {
		dropdownView.render();
		toolbar.element!.appendChild(dropdownView.element!);
		toolbar.focusTracker.add(dropdownView.element!);

		// The toolbar regroups its items only when it is resized or when its maxWidth changes.
		const maxWidth = toolbar.maxWidth;
		toolbar.maxWidth = maxWidth === 'none' ? '100%' : 'none';
		toolbar.maxWidth = maxWidth;
	}

	private detachDropdown() {
		const dropdownView = this.dropdownView;

		if (!dropdownView) {
			return;
		}

		if (dropdownView.element) {
			this.editor.ui.view.toolbar?.focusTracker.remove(dropdownView.element);
			dropdownView.element.remove();
		}

		dropdownView.destroy();
		this.dropdownView = undefined;
	}

	private setSourceMode(active: boolean) {
		this.sourceMode = active;
		this.updateEnabled();
	}

	private updateEnabled() {
		const dropdownView = this.dropdownView;

		if (!dropdownView) {
			return;
		}

		dropdownView.isEnabled = !this.editor.isReadOnly && !this.sourceMode;

		if (!dropdownView.isEnabled) {
			dropdownView.isOpen = false;
		}
	}
}

function aiActionsService(editor: Editor): AiActionsService | undefined {
	return getPluginContext(editor)?.services?.aiActions;
}
