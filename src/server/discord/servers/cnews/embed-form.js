const {
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
} = require("discord.js");

require("dotenv").config();

module.exports = function (
    client,
    noblox,
    currentUser,
    admin,
    token,
    applicationid,
    prefix
) {
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

            if (
                interaction.isButton() &&
                interaction.customId === "embed_form_start"
            ) {
                const modal = new ModalBuilder()
                    .setCustomId("embed_form_modal")
                    .setTitle("Create Embed");

                const titleInput = new TextInputBuilder()
                    .setCustomId("embed_title")
                    .setLabel("Title")
                    .setPlaceholder("Enter the title")
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(256)
                    .setRequired(false);

                const descriptionInput = new TextInputBuilder()
                    .setCustomId("embed_description")
                    .setLabel("Description")
                    .setPlaceholder("Enter the description")
                    .setStyle(TextInputStyle.Paragraph)
                    .setMaxLength(4000)
                    .setRequired(false);

                const footerInput = new TextInputBuilder()
                    .setCustomId("embed_footer")
                    .setLabel("Footer / Archive URL")
                    .setPlaceholder("Enter footer text or archive URL")
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(2000)
                    .setRequired(false);

                const imageInput = new TextInputBuilder()
                    .setCustomId("embed_thumbnail")
                    .setLabel("Image URL (optional)")
                    .setPlaceholder("https://example.com/image.png")
                    .setStyle(TextInputStyle.Short)
                    .setMaxLength(2000)
                    .setRequired(false);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(titleInput),
                    new ActionRowBuilder().addComponents(descriptionInput),
                    new ActionRowBuilder().addComponents(footerInput),
                    new ActionRowBuilder().addComponents(imageInput)
                );

                return await interaction.showModal(modal);
            }

            // =================================================
            // SUBMIT EMBED FORM
            // =================================================

            if (
                interaction.isModalSubmit() &&
                interaction.customId === "embed_form_modal"
            ) {
                await interaction.deferReply({
                    flags: MessageFlags.Ephemeral,
                });

                // =================================================
                // GET FORM VALUES
                // =================================================

                const title = interaction.fields
                    .getTextInputValue("embed_title")
                    .trim();

                const description = interaction.fields
                    .getTextInputValue("embed_description")
                    .trim();

                const footer = interaction.fields
                    .getTextInputValue("embed_footer")
                    .trim();

                const image = interaction.fields
                    .getTextInputValue("embed_thumbnail")
                    .trim();

                // =================================================
                // VALIDATE IMAGE URL
                // =================================================

                let validImage = null;

                if (image) {
                    try {
                        const parsedURL = new URL(image);

                        if (
                            parsedURL.protocol === "https:" ||
                            parsedURL.protocol === "http:"
                        ) {
                            validImage = parsedURL.href;
                        } else {
                            return await interaction.editReply({
                                content: "The image URL must use HTTP or HTTPS.",
                            });
                        }
                    } catch {
                        return await interaction.editReply({
                            content: "Please provide a valid image URL.",
                        });
                    }
                }

                // =================================================
                // GET TARGET CHANNEL
                // =================================================

                const channel = await client.channels
                    .fetch(EMBED_CHANNEL_ID)
                    .catch(() => null);

                if (
                    !channel ||
                    !channel.isTextBased() ||
                    !channel.isSendable()
                ) {
                    return await interaction.editReply({
                        content:
                            "The configured channel could not be found or cannot receive messages.",
                    });
                }

                // =================================================
                // CREATE COMPONENTS V2 CONTAINER
                // =================================================

                const container = new ContainerBuilder()
                    .setAccentColor(0x1f85dd);

                // =================================================
                // TITLE
                // =================================================

                if (title) {
                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `# ${title}`
                        )
                    );

                    container.addSeparatorComponents(
                        new SeparatorBuilder()
                    );
                }

                // =================================================
                // METADATA
                // =================================================

                const metadata = [
                    `**Author:** ${interaction.user.username}`,
                    `**Date:** ${new Date().toLocaleDateString("en-US")}`,
                    `**Subject:** ${title || "Not specified"}`,
                    `**Story:** ${description || "Not specified"}`,
                    `**Archive:** ${footer || "Not specified"}`,
                ];

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        metadata.join("\n")
                    )
                );

                // =================================================
                // DESCRIPTION
                // =================================================

                if (description) {
                    container.addSeparatorComponents(
                        new SeparatorBuilder()
                    );

                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            description
                        )
                    );
                }

                // =================================================
                // FOOTER
                // =================================================

                container.addSeparatorComponents(
                    new SeparatorBuilder()
                );

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `Posted by ${interaction.user} in ${interaction.guild?.name || "Direct Message"}`
                    )
                );

                // =================================================
                // IMAGE GALLERY
                // =================================================

                if (validImage) {
                    container.addSeparatorComponents(
                        new SeparatorBuilder()
                    );

                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            "## Images"
                        )
                    );

                    container.addMediaGalleryComponents(
                        new MediaGalleryBuilder().addItems(
                            new MediaGalleryItemBuilder()
                                .setURL(validImage)
                        )
                    );
                }

                // =================================================
                // SEND COMPONENTS V2 MESSAGE
                // =================================================

                await channel.send({
                    components: [container],
                    flags: MessageFlags.IsComponentsV2,
                    allowedMentions: {
                        parse: [],
                    },
                });

                // =================================================
                // SUCCESS RESPONSE
                // =================================================

                return await interaction.editReply({
                    content: `Your message was successfully sent to <#${channel.id}>.`,
                });
            }
        } catch (error) {
            console.warn(
                new Date(),
                "| embed-form.js |",
                "Embed form interaction error:",
                error
            );

            // =================================================
            // SAFE ERROR RESPONSE
            // =================================================

            if (interaction.deferred || interaction.replied) {
                try {
                    return await interaction.editReply({
                        content:
                            "An unexpected error occurred while creating or sending the message.",
                    });
                } catch (editError) {
                    console.warn(
                        "Failed to send embed form error response:",
                        editError
                    );
                }

                return;
            }

            try {
                return await interaction.reply({
                    content:
                        "An unexpected error occurred while opening the form.",
                    flags: MessageFlags.Ephemeral,
                });
            } catch (replyError) {
                console.warn(
                    "Failed to reply to embed form interaction:",
                    replyError
                );
            }
        }
    });
};