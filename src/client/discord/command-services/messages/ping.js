module.exports = {
	name: "ping",
	description: "Ping.",
	execute(message, args) {
		const time = new Date();
		const embedAA = {
			author: {
				name: message.client.user.username,
				icon_url: message.client.user.displayAvatarURL({
					format: "png",
					dynamic: true,
				}),
			},
			footer: {
				text: message.guild.name,
				icon_url: message.guild.iconURL({
					format: "png",
					dynamic: true,
				}),
			},
			description:
				"Pong! Response time: " +
				(time - message.createdTimestamp) / 1000 +
				" seconds!",
			timestamp: new Date(),
		};
		return message.reply({ embeds: [embedAA] });
	},
};
