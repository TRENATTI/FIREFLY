const { MinecraftServerListPing } = require("minecraft-status");

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("checkmc")
		.setDescription("Check MC Server."),
	subdata: {
		usage: "<name>",
		cooldown: 3,
	},
	async execute(interaction) {
		MinecraftServerListPing.ping(4, "88.211.237.43", 25565, 3000)
			.then((response) => {
				console.log(response);

				if (response.players.sample) {
					console.log(true);
					var dataratatata = []; // Yes the Pokemon
					dataratatata.push(`**Scriptoria MC Server**\n`);
					dataratatata.push(
						`${response.players.online} player(s) online!\n`
					);
					dataratatata.push(`Player list:`);
					var y = ``;
					for (x of response.players.sample) {
						y = y + "``" + x.name + "`` ";
					}
					dataratatata.push(y);
					var desc = ``;
					for (x of dataratatata) {
						desc = desc + `\n` + x;
					}
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
						description: desc,
						timestamp: new Date(),
					};
					console.log(response);
					return interaction.reply({ embeds: [embedAA] });
				} else {
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
						description: `**Scriptoria MC Server**\n\nNo players online!`,
						timestamp: new Date(),
					};
					console.log(response);
					return interaction.reply({ embeds: [embedAA] });
				}
			})
			.catch((error) => {
				// Error
				console.log(error);
			});
	},
};
