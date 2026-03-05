import emojis from './emojis.json';

export function emojiMentions(query:string) {
	function isNameOrKeywords( query:string, name:string, keywords:string[] ) {
		if ( name.includes(query) ) {
			return true;
		}
		if ( keywords.length !== 0 ) {
			for (let i = 0; i < keywords.length; i++ ) {
				if (keywords[i].includes(query)) {
					return true;
				}
			}
		}
		return false;
	}

	return new Promise((resolve) => {
		const emojiStore = emojis;
		const matches = emojiStore
			.filter((emoji) => isNameOrKeywords(query, emoji.id, emoji.keywords))
			.map((emoji) => {
				return { id: emoji.id, name: emoji.id.replace(/:/g, ""), text: emoji.symbol, type: 'emoji' };
			});

		resolve(matches);
	})
}
