const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("uptime")
		.setDescription(`Shows the bot's uptime.`),
	subdata: {
		cooldown: 3,
	},
	async execute(interaction) {
		uptime = interaction.client.uptime;
		days = Math.floor(uptime / 86400000);
		hours = Math.floor((uptime / 3600000) % 24);
		minutes = Math.floor((uptime / 60000) % 60);
		seconds = Math.floor((uptime / 1000) % 60);
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
				days +
				" days, " +
				hours +
				" hours, " +
				minutes +
				" minutes, " +
				seconds +
				" seconds.",
			timestamp: new Date(),
		};
		await interaction.reply({ embeds: [embedAA] });
	},
};
