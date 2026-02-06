module.exports = {
	name: "blinky",
	aliases: [],
	wildcard: true,
	execute(message) {
		return message.channel.send(
			"https://media.discordapp.net/attachments/986007344494301245/1049888320286629988/blinky.gif"
		);
	},
};
