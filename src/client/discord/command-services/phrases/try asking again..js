module.exports = {
	name: "try asking again.",
	aliases: [],
	execute(message) {
		return message.channel.send({
			files: [
				"https://github.com/Scrippy/conch.rbx/raw/main/Audio/tryaskingagain.mp3",
			],
		});
	},
};
