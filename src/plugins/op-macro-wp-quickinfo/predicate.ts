// Used by the quickinfo widget upcast (to claim the element) and the
// mention caster (to defer). One source of truth keeps the two in sync.

import type { ViewElement } from '@ckeditor/ckeditor5-engine';

const QUICKINFO_MARKER_RE = /^#{2,3}/;

export function isWorkPackageQuickinfoMention(viewElement: ViewElement) {
	if (viewElement.getAttribute('data-type') !== 'work_package') return false;
	const text = viewElement.getAttribute('data-text');
	return !!text && QUICKINFO_MARKER_RE.test(text);
}
