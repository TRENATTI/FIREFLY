const {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    MessageFlags,
} = require("discord.js");

require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("eternalhublevels")
        .setDescription("Shows users who have reached level 5 or higher."),

    subdata: {
        cooldown: 300, // 5 minutes
    },

    async execute(interaction, noblox, admin) {
        const db = admin.database();


        const USERS_PATH =
            "system/user_leveling/eternal_conflict_hub/users";

        const snapshot = await db.ref(USERS_PATH).once("value");
        const users = snapshot.val() || {};

        const qualifiedUsers = [];

        for (const [key, data] of Object.entries(users)) {
            if (!data || typeof data !== "object") continue;

            const xp = Number(data.message_xp || 0);

            if (!Number.isFinite(xp)) continue;

            const level = Math.floor((xp/60) ** .5)
            console.log(level)
            if (level >= 5) {
                const discordId = key.startsWith("user_")
                    ? key.substring(5)
                    : key;

                qualifiedUsers.push({
                    discordId,
                    xp,
                    level,
                });
            }
        }

        // Highest level first, then highest XP
        qualifiedUsers.sort((a, b) => {
            if (b.level !== a.level) {
                return b.level - a.level;
            }

            return b.xp - a.xp;
        });

        const USERS_PER_PAGE = 10;

        const totalPages = Math.max(
            1,
            Math.ceil(qualifiedUsers.length / USERS_PER_PAGE)
        );

        let currentPage = 0;

        function createPage(page) {
            const start = page * USERS_PER_PAGE;
            const pageUsers = qualifiedUsers.slice(
                start,
                start + USERS_PER_PAGE
            );

            const container = new ContainerBuilder();

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `## Level 5+ Users\n` +
                    `Showing users who have reached **level 5 or higher**.\n\n` +
                    `**Total:** ${qualifiedUsers.length}\n` +
                    `**Page:** ${page + 1}/${totalPages}`
                )
            );

            container.addSeparatorComponents(
                new SeparatorBuilder()
            );

            if (pageUsers.length === 0) {

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        "No users have reached level 5 yet."
                    )
                );

            } else {

                const lines = [];

                pageUsers.forEach((user, index) => {

                    const position =
                        start + index + 1;

                    lines.push(
                        `**${position}. <@${user.discordId}>**\n` +
                        `Level: **${user.level}** • XP: **${user.xp.toLocaleString()}**`
                    );
                });

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(
                        lines.join("\n\n")
                    )
                );
            }

            container.addSeparatorComponents(
                new SeparatorBuilder()
            );

            const previousButton = new ButtonBuilder()
                .setCustomId("level5_previous")
                .setLabel("Previous")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0);

            const nextButton = new ButtonBuilder()
                .setCustomId("level5_next")
                .setLabel("Next")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page >= totalPages - 1);

            container.addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    previousButton,
                    nextButton
                )
            );

            return container;
        }

        await interaction.reply({
            components: [createPage(currentPage)],
            flags: MessageFlags.IsComponentsV2,
            ephemeral: true,
        });

        const message = await interaction.fetchReply();

        const collector = message.createMessageComponentCollector({
            time: 5 * 60 * 1000,
        });

        collector.on("collect", async (buttonInteraction) => {

            // Only the person who ran the command can control it
            if (
                buttonInteraction.user.id !==
                interaction.user.id
            ) {
                await buttonInteraction.reply({
                    content:
                        "Only the user who ran this command can use these buttons.",
                    ephemeral: true,
                });

                return;
            }

            if (
                buttonInteraction.customId ===
                "level5_previous"
            ) {
                if (currentPage > 0) {
                    currentPage--;
                }
            }

            if (
                buttonInteraction.customId ===
                "level5_next"
            ) {
                if (currentPage < totalPages - 1) {
                    currentPage++;
                }
            }

            await buttonInteraction.update({
                components: [createPage(currentPage)],
            });
        });

        collector.on("end", async () => {

            try {

                const disabledContainer =
                    createPage(currentPage);

                // Rebuild the page with disabled buttons
                const components =
                    disabledContainer.components;

                const lastComponent =
                    components[components.length - 1];

                if (
                    lastComponent &&
                    lastComponent.components
                ) {
                    for (
                        const button of lastComponent.components
                    ) {
                        button.setDisabled(true);
                    }
                }

                await interaction.editReply({
                    components: [disabledContainer],
                    ephemeral: true
                });

            } catch (error) {
                console.error(
                    "Failed to disable level5 buttons:",
                    error
                );
            }
        });
    },
};