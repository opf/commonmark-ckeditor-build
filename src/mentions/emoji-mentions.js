export function emojiMentions(query) {
	return new Promise((resolve, reject) => {
		const database = {
			'thumbs_up': '👍',
			'thumbs_down': '👎',
		}

		const matches = Object
			.keys(database)
			.filter((name) => name.includes(query))
			.map((name) => {
				return { id: `:${name}`, name, text: database[name], type: 'emoji' };
			})

		resolve(matches);
	})
}
