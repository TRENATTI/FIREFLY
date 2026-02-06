module.exports = {
	name: "no.",
	aliases: [],
	wildcard: false,
	execute(message) {
		return message.channel.send({
			files: [
				"https://github.com/Scrippy/conch.rbx/raw/main/Audio/no.mp3",
			],
		});
	},
};
