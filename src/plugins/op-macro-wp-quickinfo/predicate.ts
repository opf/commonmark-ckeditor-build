// Used by the quickinfo widget upcast (to claim the element) and the
// mention caster (to defer). One source of truth keeps the two in sync.

const QUICKINFO_MARKER_RE = /^#{2,3}/;

export function isWorkPackageQuickinfoMention(viewElement) {
	if (viewElement.getAttribute('data-type') !== 'work_package') return false;
	const text = viewElement.getAttribute('data-text');
	return !!text && QUICKINFO_MARKER_RE.test(text);
}
