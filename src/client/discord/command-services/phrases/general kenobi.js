module.exports = {
	name: "general kenobi",
	aliases: [],
	wildcard: false,
	execute(message) {
		return message.channel.send("You are a bold one.");
	},
};
