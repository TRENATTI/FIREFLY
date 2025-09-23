const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("createthread")
		.setDescription("Admin internal command.")
        .addStringOption((option) =>
			option
				.setName("guild")
				.setDescription("Guild ID to add thread.")
				.setRequired(true)
		)
        .addStringOption((option) =>
			option
				.setName("channel")
				.setDescription("Channel ID to add thread.")
				.setRequired(true)
		)
        .addStringOption((option) =>
			option
				.setName("title")
				.setDescription("Title of Thread.")
				.setRequired(true)
		)
         .addStringOption((option) =>
			option
				.setName("content")
				.setDescription("Content of Thread.")
				.setRequired(true)
		),
	subdata: {
		cooldown: 3,
	},
	async execute(interaction) {
        async function isAuthorized() {
			const GUILDID = interaction.options.getString("guild")
			const CHANNELID = interaction.options.getString("channel")
			const TITLE = interaction.options.getString("title")
			const CONTENT =  eval(
					"`" + interaction.options.getString(`content`) + "`"
				);
			try {
				const guild = await interaction.client.guilds.fetch(
					`${GUILDID}`
				);
				if (guild.id) {
					const channel = await guild.channels.fetch(
						`${CHANNELID}`
					);
					channel.threads.create({ name: `${TITLE}`, message: { content: `${CONTENT}` }, appliedTags: [] });
				}
			} catch (error) {
				console.log(error)
			}
		}

		if (
			interaction.user.id == "170639211182030850" ||
			interaction.user.id == "463516784578789376" ||
			interaction.user.id == "206090047462703104" ||
			interaction.user.id == "1154775391597240391"
		) {
			isAuthorized();
		} else {
			return interaction
				.reply({
					content: `Sorry ${message.author}, but only the owners can run that command!`,
				})
				.then((message) =>
					setTimeout(() => message.delete(), 10_000)
				);
		}
	},
};
