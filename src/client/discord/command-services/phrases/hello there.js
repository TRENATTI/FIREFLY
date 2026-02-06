module.exports = {
	name: "hello there",
	aliases: [],
	wildcard: false,
	execute(message) {
		return message.channel.send("General Kenobi.");
	},
};
