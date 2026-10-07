export function customItemRenderer( item ) {
    const itemElement = document.createElement( 'span' );

	if (item.type === 'user' || item.type === 'work_package') {
		itemElement.setAttribute('data-hover-card-trigger-target', 'trigger');
		itemElement.setAttribute('data-hover-card-url', `${item.link}/hover_card`);
	}

	itemElement.classList.add( 'mention-list-item' );
	itemElement.textContent = item.name;

    return itemElement;
}

export function emojiItemRenderer( item ) {
	const itemElement = document.createElement( 'span' );

	itemElement.classList.add('mention-list-item' );
	itemElement.textContent = `${item.text} ${item.name}`;

	return itemElement;
}
