module.exports = {
	name: "birthday",
	aliases: [],
	wildcard: true,
	execute(message) {
		return message.channel.send("Happy Birthday!!!");
	},
};
