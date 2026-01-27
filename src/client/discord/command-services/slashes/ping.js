const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription(
			"Shows latency between the server and when the message was sent."
		),
	subdata: {
		cooldown: 3,
	},
	async execute(interaction) {
		const time = new Date();
		const embedAA = {
			author: {
				name: interaction.client.user.username,
				icon_url: interaction.client.user.displayAvatarURL({
					format: "png",
					dynamic: true,
				}),
			},
			color: 0x0099ff,
			footer: {
				text: interaction.guild.name,
				icon_url: interaction.guild.iconURL({
					format: "png",
					dynamic: true,
				}),
			},
			description:
				"Pong! Response time: " +
				(time - interaction.createdTimestamp) / 1000 +
				" seconds!",
			timestamp: new Date(),
		};
		await interaction.reply({ embeds: [embedAA] });
	},
};
