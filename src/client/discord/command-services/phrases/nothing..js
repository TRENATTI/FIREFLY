module.exports = {
	name: "nothing.",
	aliases: [],
	wildcard: false,
	execute(message) {
		return message.channel.send({
			files: [
				"https://github.com/Scrippy/conch.rbx/raw/main/Audio/nothing.mp3",
			],
		});
	},
};
