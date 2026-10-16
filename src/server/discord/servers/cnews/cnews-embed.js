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
    ButtonBuilder,
    ButtonStyle,
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
    const MAX_IMAGES = 10;
    const FORM_TIMEOUT = 10 * 60 * 1000;

    // Stores article details until the second modal is submitted.
    // Keyed by Discord user ID.
    const pendingForms = new Map();

    // =========================================================
    // HELPERS
    // =========================================================

    function createInput(
        customId,
        label,
        placeholder,
        style,
        maxLength,
        required = false
    ) {
        return new TextInputBuilder()
            .setCustomId(customId)
            .setLabel(label)
            .setPlaceholder(placeholder)
            .setStyle(style)
            .setMaxLength(maxLength)
            .setRequired(required);
    }

    function parseImageURLs(input) {
        const urls = input
            .split(/\r?\n/)
            .map((url) => url.trim())
            .filter(Boolean);

        if (urls.length > MAX_IMAGES) {
            throw new Error(
                `You can include a maximum of ${MAX_IMAGES} images.`
            );
        }

        return urls.map((url) => {
            let parsed;

            try {
                parsed = new URL(url);
            } catch {
                throw new Error(`Invalid image URL: ${url}`);
            }

            if (
                parsed.protocol !== "https:" &&
                parsed.protocol !== "http:"
            ) {
                throw new Error(
                    `Image URLs must use HTTP or HTTPS: ${url}`
                );
            }

            return parsed.href;
        });
    }

    function createContinueButton() {
        return new ButtonBuilder()
            .setCustomId("embed_form_continue")
            .setLabel("Continue")
            .setStyle(ButtonStyle.Primary);
    }

    function createArticleModal() {
        const modal = new ModalBuilder()
            .setCustomId("embed_form_modal")
            .setTitle("Create Article");

        const authorInput = createInput(
            "embed_author",
            "Author",
            "Enter the article author",
            TextInputStyle.Short,
            256,
            true
        );

        const subjectInput = createInput(
            "embed_subject",
            "Subject",
            "Enter the subject",
            TextInputStyle.Short,
            256,
            true
        );

        const storyInput = createInput(
            "embed_story",
            "Story",
            "Enter the story headline",
            TextInputStyle.Short,
            256,
            true
        );

        const archiveInput = createInput(
            "embed_archive",
            "Archive",
            "Enter the Trello archive URL",
            TextInputStyle.Short,
            256,
            true
        );

        const descriptionInput = createInput(
            "embed_description",
            "Description",
            "Enter the article description",
            TextInputStyle.Paragraph,
            4000,
            false
        );

        modal.addComponents(
            new ActionRowBuilder().addComponents(authorInput),
            new ActionRowBuilder().addComponents(subjectInput),
            new ActionRowBuilder().addComponents(storyInput),
            new ActionRowBuilder().addComponents(archiveInput),
            new ActionRowBuilder().addComponents(descriptionInput)
        );

        return modal;
    }

    function createSourcesImagesModal() {
        const modal = new ModalBuilder()
            .setCustomId("embed_sources_images_modal")
            .setTitle("Sources and Images");

        const sourcesInput = createInput(
            "embed_sources",
            "Sources",
            "Enter source URLs, one per line",
            TextInputStyle.Paragraph,
            4000,
            false
        );

        const imagesInput = createInput(
            "embed_images",
            "Image URLs (one per line, max 10)",
            "Enter image URLs, one per line",
            TextInputStyle.Paragraph,
            4000,
            false
        );

        modal.addComponents(
            new ActionRowBuilder().addComponents(sourcesInput),
            new ActionRowBuilder().addComponents(imagesInput)
        );

        return modal;
    }

    // =========================================================
    // INTERACTION HANDLER
    // =========================================================

    client.on("interactionCreate", async (interaction) => {
        try {
            // =================================================
            // STEP 1: OPEN ARTICLE DETAILS MODAL
            // =================================================

            if (
                interaction.isButton() &&
                interaction.customId === "embed_form_start"
            ) {
                return await interaction.showModal(
                    createArticleModal()
                );
            }

            // =================================================
            // STEP 2: SUBMIT ARTICLE DETAILS
            // SAVE DATA AND DISPLAY CONTINUE BUTTON
            // =================================================

            if (
                interaction.isModalSubmit() &&
                interaction.customId === "embed_form_modal"
            ) {
                const form = {
                    author: interaction.fields
                        .getTextInputValue("embed_author")
                        .trim(),

                    subject: interaction.fields
                        .getTextInputValue("embed_subject")
                        .trim(),

                    story: interaction.fields
                        .getTextInputValue("embed_story")
                        .trim(),

                    archive: interaction.fields
                        .getTextInputValue("embed_archive")
                        .trim(),

                    description: interaction.fields
                        .getTextInputValue("embed_description")
                        .trim(),
                };

                // Save article details for the second step.
                pendingForms.set(interaction.user.id, {
                    form,
                    guildId: interaction.guildId,
                    createdAt: Date.now(),
                });

                // Discord requires a separate interaction to open
                // the second modal, so provide a Continue button.
                return await interaction.reply({
                    content:
                        "Your article details have been saved. " +
                        "Click **Continue** to add sources and images. " +
                        "You have 10 minutes to complete the form.",

                    components: [
                        new ActionRowBuilder().addComponents(
                            createContinueButton()
                        ),
                    ],

                    flags: MessageFlags.Ephemeral,
                });
            }

            // =================================================
            // STEP 3: CONTINUE BUTTON
            // OPEN SOURCES AND IMAGES MODAL
            // =================================================

            if (
                interaction.isButton() &&
                interaction.customId === "embed_form_continue"
            ) {
                const pending = pendingForms.get(
                    interaction.user.id
                );

                if (
                    !pending ||
                    Date.now() - pending.createdAt > FORM_TIMEOUT ||
                    pending.guildId !== interaction.guildId
                ) {
                    pendingForms.delete(interaction.user.id);

                    return await interaction.reply({
                        content:
                            "Your article form has expired. " +
                            "Please start again.",

                        flags: MessageFlags.Ephemeral,
                    });
                }

                // This is now a button interaction, not a modal
                // submission. It can open the next modal.
                return await interaction.showModal(
                    createSourcesImagesModal()
                );
            }

            // =================================================
            // STEP 4: SUBMIT SOURCES AND IMAGES
            // BUILD AND PUBLISH ARTICLE
            // =================================================

            if (
                interaction.isModalSubmit() &&
                interaction.customId ===
                    "embed_sources_images_modal"
            ) {
                await interaction.deferReply({
                    flags: MessageFlags.Ephemeral,
                });

                const pending = pendingForms.get(
                    interaction.user.id
                );

                if (
                    !pending ||
                    Date.now() - pending.createdAt > FORM_TIMEOUT ||
                    pending.guildId !== interaction.guildId
                ) {
                    pendingForms.delete(interaction.user.id);

                    return await interaction.editReply({
                        content:
                            "Your article form has expired. " +
                            "Please start again.",
                    });
                }

                // Consume the pending form.
                pendingForms.delete(interaction.user.id);

                const {
                    author,
                    subject,
                    story,
                    archive,
                    description,
                } = pending.form;

                const sources = interaction.fields
                    .getTextInputValue("embed_sources")
                    .trim();

                const imageText = interaction.fields
                    .getTextInputValue("embed_images")
                    .trim();

                // =================================================
                // VALIDATE IMAGES
                // =================================================

                let imageURLs;

                try {
                    imageURLs = parseImageURLs(imageText);
                } catch (error) {
                    return await interaction.editReply({
                        content: error.message,
                    });
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
                            "The configured channel could not be found " +
                            "or cannot receive messages.",
                    });
                }

                // =================================================
                // CREATE COMPONENTS V2 CONTAINER
                // =================================================

                const container = new ContainerBuilder()
                    .setAccentColor(0x1f85dd);

                // =================================================
                // ARTICLE TITLE
                // =================================================

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        `# ${subject}`
                    )
                );

                container.addSeparatorComponents(
                    new SeparatorBuilder()
                );

                // =================================================
                // METADATA
                // =================================================

                const metadata = [
                    `**Author:** ${author}`,
                    `**Date:** ${new Date().toLocaleDateString("en-US")}`,
                    `**Subject:** ${subject}`,
                    `**Story:** ${story}`,
                    `**Archive:** ${archive}`,
                ];

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        metadata.join("\n")
                    )
                );

                // =================================================
                // ARTICLE DESCRIPTION
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
                // SOURCES
                // =================================================

                if (sources) {
                    container.addSeparatorComponents(
                        new SeparatorBuilder()
                    );

                    const sourceLines = sources
                        .split(/\r?\n/)
                        .map((source) => source.trim())
                        .filter(Boolean)
                        .map((source) => `- ${source}`)
                        .join("\n");

                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            `**Sources**\n${sourceLines}`
                        )
                    );
                }

                // =================================================
                // IMAGE GALLERY
                // =================================================

                if (imageURLs.length > 0) {
                    container.addSeparatorComponents(
                        new SeparatorBuilder()
                    );

                    container.addTextDisplayComponents(
                        new TextDisplayBuilder().setContent(
                            "**Images**"
                        )
                    );

                    const gallery = new MediaGalleryBuilder();

                    gallery.addItems(
                        ...imageURLs.map((url) =>
                            new MediaGalleryItemBuilder().setURL(url)
                        )
                    );

                    container.addMediaGalleryComponents(gallery);
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
                    content:
                        `Your article was successfully sent to <#${channel.id}>.`,
                });
            }
        } catch (error) {
            console.warn(
                new Date(),
                "| embed-form.js |",
                "Article form interaction error:",
                error
            );

            if (interaction.deferred || interaction.replied) {
                try {
                    return await interaction.editReply({
                        content:
                            "An unexpected error occurred while creating " +
                            "or sending the article.",
                    });
                } catch (editError) {
                    console.warn(
                        "Failed to send article form error response:",
                        editError
                    );
                }

                return;
            }

            try {
                return await interaction.reply({
                    content:
                        "An unexpected error occurred while processing " +
                        "the article form.",

                    flags: MessageFlags.Ephemeral,
                });
            } catch (replyError) {
                console.warn(
                    "Failed to send article form error response:",
                    replyError
                );
            }
        }
    });
};