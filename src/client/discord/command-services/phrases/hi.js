module.exports = {
	name: "hi",
	aliases: [],
	execute(message) {
		return message.channel.send("hello there <@" + message.author.id + ">");
	},
};
