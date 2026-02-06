module.exports = {
	name: "cat",
	aliases: ["pussy"],
	wildcard: false,
	nocooldown: true,
	execute(message) {
		return message.channel.send(
			"https://cdn.discordapp.com/attachments/539548593321672734/880195504997294170/E9b2IiAXsAM004K.png"
		);
	},
};
