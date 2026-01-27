module.exports = {
	name: "hi",
	aliases: [],
	wildcard: false,
	execute(message) {
		return message.channel.send("hello there <@" + message.author.id + ">");
	},
};
