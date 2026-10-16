const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags } = require("discord.js");

require("dotenv").config();

module.exports = function (client, noblox, currentUser, admin, token, applicationid, prefix) {
	// =========================================================
	// CONFIGURATION
	// =========================================================

	const EMBED_CHANNEL_ID = "784047136953729074";

	// =========================================================
	// INTERACTION HANDLER
	// =========================================================

	client.on("interactionCreate", async (interaction) => {
		try {
			// =================================================
			// OPEN EMBED FORM
			// =================================================

			if (interaction.isButton() && interaction.customId === "embed_form_start") {
				const modal = new ModalBuilder()

					.setCustomId("embed_form_modal")

					.setTitle("Create Embed");

				// =================================================
				// EMBED TITLE
				// =================================================

				const titleInput = new TextInputBuilder()

					.setCustomId("embed_title")

					.setLabel("Embed Title")

					.setPlaceholder("Enter the embed title")

					.setStyle(TextInputStyle.Short)

					.setMaxLength(256)

					.setRequired(false);

				// =================================================
				// EMBED DESCRIPTION
				// =================================================

				const descriptionInput = new TextInputBuilder()

					.setCustomId("embed_description")

					.setLabel("Embed Description")

					.setPlaceholder("Enter the embed description")

					.setStyle(TextInputStyle.Paragraph)

					.setMaxLength(4000)

					.setRequired(false);

				// =================================================
				// EMBED FOOTER
				// =================================================

				const footerInput = new TextInputBuilder()

					.setCustomId("embed_footer")

					.setLabel("Embed Footer (Optional)")

					.setPlaceholder("Enter optional footer text")

					.setStyle(TextInputStyle.Short)

					.setMaxLength(2048)

					.setRequired(false);

                    // =================================================
				// EMBED DESCRIPTION
				// =================================================

				const thumbnailInput = new TextInputBuilder()

					.setCustomId("embed_thumbnail")

					.setLabel("Embed Thumbnail")

					.setPlaceholder("Enter the embed thumbnail")

					.setStyle(TextInputStyle.Paragraph)

					.setMaxLength(4000)

					.setRequired(false);
				// =================================================
				// ADD MODAL COMPONENTS
				// =================================================

				modal.addComponents(
					new ActionRowBuilder().addComponents(titleInput),

					new ActionRowBuilder().addComponents(descriptionInput),

					new ActionRowBuilder().addComponents(footerInput),

                    new ActionRowBuilder().addComponents(thumbnailInput),
				);

				return interaction.showModal(modal);
			}

			// =================================================
			// SUBMIT EMBED FORM
			// =================================================

			if (interaction.isModalSubmit() && interaction.customId === "embed_form_modal") {
				await interaction.deferReply({
					flags: MessageFlags.Ephemeral,
				});

				// =================================================
				// GET FORM VALUES
				// =================================================

				const title = interaction.fields.getTextInputValue("embed_title").trim();

				const description = interaction.fields.getTextInputValue("embed_description").trim();

				const footer = interaction.fields.getTextInputValue("embed_footer").trim();

                const thumbnail = interaction.fields.getTextInputValue("embed_thumbnail").trim();

				// =================================================
				// VALIDATE FORM
				// =================================================

				/*if (!title || !description) {
					return interaction.editReply({
						content: "The embed title and description are required.",
					});
				}*/

				// =================================================
				// GET TARGET CHANNEL
				// =================================================

				const channel = await client.channels.fetch(EMBED_CHANNEL_ID).catch(() => null);

				if (!channel || !channel.isTextBased() || !channel.isSendable()) {
					return interaction.editReply({
						content: "The configured embed channel could not be found or cannot receive messages.",
					});
				}

				// =================================================
				// CREATE EMBED
				// =================================================

				const embed = new EmbedBuilder()

					.setColor(0x1f85dd)

					.setTitle(title)

					.setDescription(description)

					.setTimestamp();

				// =================================================
				// SET FOOTER
				// =================================================

				if (footer) {
					embed.setFooter({
						text: `${footer} | https://discord.gg/PsdEAAuG4K`,
					});
                } else {
                    embed.setFooter({
                        text: `https://discord.gg/PsdEAAuG4K`
                    })
				}

				// =================================================
				// SEND EMBED
				// =================================================

				await channel.send({
					embeds: [embed],
				});

				// =================================================
				// SUCCESS RESPONSE
				// =================================================

				return interaction.editReply({
					content: `Your embed was successfully sent to <#${channel.id}>.`,
				});
			}
		} catch (error) {
			console.warn(new Date(), "| embed-form.js |", "Embed form interaction error:", error);

			// =================================================
			// SAFE ERROR RESPONSE
			// =================================================

			if (interaction.deferred || interaction.replied) {
				try {
					return await interaction.editReply({
						content: "An unexpected error occurred while creating or sending the embed.",
					});
				} catch (editError) {
					console.warn("Failed to send embed form error response:", editError);
				}

				return;
			}

			try {
				return await interaction.reply({
					content: "An unexpected error occurred while opening the embed form.",

					flags: MessageFlags.Ephemeral,
				});
			} catch (replyError) {
				console.warn("Failed to reply to embed form interaction:", replyError);
			}
		}
	});
};
