module.exports = {
	name: "hello there",
	aliases: [],
	execute(message) {
		return message.channel.send("General Kenobi.");
	},
};
