module.exports = {
	name: "maybe some day.",
	aliases: [],
	wildcard: false,
	execute(message) {
		return message.channel.send({
			files: [
				"https://github.com/Scrippy/conch.rbx/raw/main/Audio/maybesomeday.mp3",
			],
		});
	},
};
