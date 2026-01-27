module.exports = {
	name: "boing",
	aliases: [],
	wildcard: false,
	execute(message) {
		return message.channel.send(`boing`);
	},
};
