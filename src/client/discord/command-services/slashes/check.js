const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("check")
		.setDescription("Admin internal command."),
	subdata: {
		cooldown: 3,
	},
	async execute(interaction) {
		if (interaction.user.id != 206090047462703104) {
			await interaction.reply({ content: "N/A" });
		} else {
			const embed = new EmbedBuilder().setTitle("Servers");

			interaction.client.guilds.cache.forEach((guild) => {
				embed.addFields({
					name: guild.name,
					value: `ID: ${guild.id} | OWNER: <@${guild.ownerId}>`,
				});
			});
			await interaction.reply({ embeds: [embed] });
		}
	},
};
