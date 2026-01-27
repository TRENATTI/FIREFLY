module.exports = {
	name: "no.",
	aliases: [],
	execute(message) {
		return message.channel.send({
			files: [
				"https://github.com/Scrippy/conch.rbx/raw/main/Audio/no.mp3",
			],
		});
	},
};
