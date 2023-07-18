export function customItemRenderer( item ) {
    const itemElement = document.createElement( 'span' );

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
