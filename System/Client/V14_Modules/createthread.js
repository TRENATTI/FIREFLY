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
        const GUILDID = interaction.options.getString("name")
        const CHANNELID = interaction.options.getString("name")
        const TITLE = interaction.options.getString("title")
        const CONTENT = interaction.options.getString("content")
		try {
            const guild = await client.guilds.fetch(
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
	},
};
