module.exports = {
	name: "yes.",
	aliases: [],
	execute(message) {
		return message.channel.send({
			files: [
				"https://github.com/Scrippy/conch.rbx/raw/main/Audio/yes.mp3",
			],
		});
	},
};
