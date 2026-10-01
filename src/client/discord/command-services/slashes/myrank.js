const {
    SlashCommandBuilder,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    MessageFlags,
} = require("discord.js");

require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("myrank")
        .setDescription("Shows your Eternal Conflict Hub level and XP."),

    subdata: {
        cooldown: 10,
    },

    async execute(interaction, noblox, admin) {
        const db = admin.database();

        const USERS_PATH =
            "system/user_leveling/eternal_conflict_hub/users";

        const userId = interaction.user.id;

        const userRef = db.ref(`${USERS_PATH}/user_${userId}`);
        const snapshot = await userRef.once("value");

        const data = snapshot.val();

        if (!data || typeof data !== "object") {
            const container = new ContainerBuilder();

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "## Your Rank\n\n" +
                    "You do not have any XP recorded yet."
                )
            );

            await interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                ephemeral: true,
            });

            return;
        }

        const xp = Number(data.message_xp || 0);

        if (!Number.isFinite(xp)) {
            const container = new ContainerBuilder();

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    "## Your Rank\n\n" +
                    "Your XP data is invalid."
                )
            );

            await interaction.reply({
                components: [container],
                flags: MessageFlags.IsComponentsV2,
                ephemeral: true,
            });

            return;
        }

        const level = Math.floor(Math.sqrt(xp / 60));

        const xpForCurrentLevel = 60 * (level ** 2);
        const xpForNextLevel = 60 * ((level + 1) ** 2);

        const xpProgress = xp - xpForCurrentLevel;
        const xpNeeded = xpForNextLevel - xpForCurrentLevel;

        const progressPercent =
            level >= 1
                ? Math.floor((xpProgress / xpNeeded) * 100)
                : Math.floor((xp / xpForNextLevel) * 100);

        const container = new ContainerBuilder();

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## Your Eternal Conflict Hub Rank\n\n` +
                `**User:** <@${userId}>\n` +
                `**Level:** **${level}**\n` +
                `**XP:** **${xp.toLocaleString()}**\n\n` +
                `**Progress to Level ${level + 1}:**\n` +
                `${xpProgress.toLocaleString()} / ${xpNeeded.toLocaleString()} XP ` +
                `(**${Math.min(progressPercent, 100)}%**)`
            )
        );

        container.addSeparatorComponents(
            new SeparatorBuilder()
        );

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `**Total XP:** ${xp.toLocaleString()}\n` +
                `**XP Required for Level ${level + 1}:** ${xpForNextLevel.toLocaleString()}`
            )
        );

        await interaction.reply({
            components: [container],
            flags: MessageFlags.IsComponentsV2,
            ephemeral: true,
        });
    },
};
