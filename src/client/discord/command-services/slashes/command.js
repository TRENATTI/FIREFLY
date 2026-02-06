const { SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("command")
		.setDescription(`Specific command information.`)
		.addStringOption((option) =>
			option
				.setName("name")
				.setDescription(`The command name to be searched for.`)
				.setRequired(true)
		),
	subdata: {
		usage: "<name>",
		cooldown: 3,
	},
	async execute(interaction) {
		const data = [];
		const commands = interaction.client.v14_commands;
		const command = commands.get(interaction.options.getString("name"));

		if (!command) {
			await interaction.reply("That's not a valid command!");
		}

		data.push(`**Name:** ${command.data.name}`);

		if (command.data.description)
			data.push(`**Description:** ${command.data.description}`);
		if (command.subdata.usage)
			data.push(
				`**Usage:** /${command.data.name} ${command.subdata.usage}`
			);

		//data.push(`**Cooldown:** ${command.subdata.cooldown || 3} second(s)`);

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
		return interaction.reply({ embeds: [embedAA] });
	},
};
