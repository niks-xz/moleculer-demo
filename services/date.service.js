module.exports = {
	name: "date",
	actions: {
		actualDate: {
			params: {
				timeZone: {
					type: "string",
					default: "UTC"
				}
			},
			async handler(ctx) {
				const { timeZone } = ctx.params;
				const date = new Date();

				const formatter = new Intl.DateTimeFormat("ru-RU", {
					year: "numeric",
					month: "2-digit",
					day: "2-digit",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
					timeZone: timeZone,
					hour12: false
				});

				return formatter.format(date);
			}
		},
	}
};
