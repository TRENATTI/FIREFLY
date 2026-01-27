module.exports = {
	name: "i dont think so.",
	aliases: [`i don't think so.`],
	execute(message) {
		return message.channel.send({
			files: [
				"https://github.com/Scrippy/conch.rbx/raw/main/Audio/idontthinkso.mp3",
			],
		});
	},
};
