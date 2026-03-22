const {
	EmbedBuilder,
	SlashCommandBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ButtonBuilder,
} = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("snu")
		.setDescription("Admin internal command  to update embeds")
		.addStringOption((option) =>
			option
				.setName("messageid")
				.setDescription("Message ID>")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("channelid")
				.setDescription("Channel ID.")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("serverid")
				.setDescription("Server ID.")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("message")
				.setDescription("Message to add.")
				.setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName("button")
				.setDescription("Button Message to add.")
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("thumbnail")
				.setDescription("Thumbnail to add.")
				.setRequired(false)
		),
	subdata: {
		cooldown: 15,
	},
	async execute(interaction, noblox, admin) {
		var db = admin.database();
		async function updateMsg(interaction) {
			const targetMessage = interaction.options.getString("messageid");
			const targetChannel = interaction.options.getString("channelid");
			const targetServer = interaction.options.getString("serverid");
			const buttonValue = interaction.options.getString("button");
			const thumbnailValue = interaction.options.getString("thumbnail");
			const messageValue = eval(
				"`" + interaction.options.getString(`message`) + "`"
			);

			console.log(
				targetMessage,
				targetChannel,
				targetServer,
				messageValue,
				buttonValue,
				thumbnailValue
			);
			const guild = await interaction.client.guilds.fetch(targetServer);
			const channel = await guild.channels.fetch(targetChannel);
			const message = await channel.messages.fetch(targetMessage);

			let embedAA = {
				author: {
					name: interaction.user.username,
					icon_url: interaction.user.displayAvatarURL({
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
				description: messageValue,
				timestamp: new Date(),
			};


			const snu_button = new ButtonBuilder()
				.setCustomId("button")
				.setLabel(buttonValue || "")
				.setStyle(ButtonStyle.Secondary);
			const snu_actionrowbuilder = new ActionRowBuilder().addComponents(
				snu_button
			);

			if (buttonValue == "-") {
				if (thumbnailValue == "-") {
					message.edit({ embeds: [embedAA], components: [] });
				} else {
					let embedThumbnailAA = {
						author: {
							name: interaction.user.username,
							icon_url: interaction.user.displayAvatarURL({
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
						thumbnail: {
							url: thumbnailValue
						},
						  
						description: messageValue,
						timestamp: new Date(),
					};
					message.edit({ embeds: [embedThumbnailAA], components: [] });
				}
			} else {
				if (thumbnailValue == "-") {
					message.edit({
						embeds: [embedAA],
						components: [snu_actionrowbuilder],
					});
				} else {
					let embedThumbnailAA = {
						author: {
							name: interaction.user.username,
							icon_url: interaction.user.displayAvatarURL({
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
						thumbnail: {
							url: thumbnailValue
						},
						  
						description: messageValue,
						timestamp: new Date(),
					};
					message.edit({
						embeds: [embedThumbnailAA],
						components: [snu_actionrowbuilder],
					});
				}
			}
		}
		if (
			interaction.user.id == "170639211182030850" ||
			interaction.user.id == "463516784578789376" ||
			interaction.user.id == "206090047462703104" ||
			interaction.user.id == "1154775391597240391"
		) {
			interaction
				.reply({
					content: `Updating message...`,
				})
				.then(updateMsg(interaction));
		}
	},
};
