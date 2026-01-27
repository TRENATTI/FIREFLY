module.exports = {
	name: "frog",
	aliases: [],
	wildcard: true,
	execute(message) {
		return message.channel.send("boing ribbit boing");
	},
};
