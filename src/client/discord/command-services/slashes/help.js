const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("help")
		.setDescription("Gives information about the bot."),
	subdata: {
		cooldown: 3,
	},
	async execute(interaction) {
		const embedAA = {
			title: "Vlale Here! >:3",
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
			description: `Hiya! I\'m a *multi-purple* discord bot, promptly set for serving the community. I provide security, entertainment, and utility services for my communities.\n\n You can view more of my commands via \`\`/commands\`\``,
			timestamp: new Date(),
		};
		await interaction.reply({ embeds: [embedAA] });
	},
};
