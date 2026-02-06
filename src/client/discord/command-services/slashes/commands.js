const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("commands")
		.setDescription(`Command information.`),
	subdata: {
		cooldown: 3,
	},
	async execute(interaction) {
		const data = [];
		const v12_commands = interaction.client.commands_v12;
		const v14_commands = interaction.client.v14_commands;
		const phrase_commands = interaction.client.phrases_v12;
		data.push();
		data.push("Here's a list of message based commands using my prefix!");
		data.push(
			"``" +
				v12_commands
					.map((command) => command.name)
					.sort()
					.join("``, ``") +
				"``"
		);

		data.push(`\nHere's a list of my slash commands!`);
		data.push(
			"``" +
				v14_commands
					.map((command) => command.data.name)
					.sort()
					.join("``, ``") +
				"``"
		);
		data.push(`\nHere's a list of my phrases!`);
		data.push(
			"``" +
				phrase_commands
					.map((phrase) => phrase.name)
					.sort()
					.join("``, ``") +
				"``"
		);
		//data.push(`\nYou can send \`${prefix}help [command name]\` to get info on a specific command!`);

		//return message.channel.send(data, { split: true })
		var x;
		var y = ``;
		for (x of data) {
			y = y + `\n` + x;
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
			description: y,
			timestamp: new Date(),
		};
		await interaction.reply({ embeds: [embedAA] });
	},
};
