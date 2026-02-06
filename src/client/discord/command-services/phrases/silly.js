module.exports = {
	name: "silly",
	aliases: [`watermelon`],
	wildcard: true,
	execute(message) {
		return message.channel.send({
			files: [
				"https://github.com/Scrippy/conch.rbx/raw/main/Audio/watermelon.mp4",
			],
		});
	},
};
