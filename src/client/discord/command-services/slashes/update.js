const {
    SlashCommandBuilder
} = require("discord.js");

require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("update")
        .setDescription("Update your Discord nickname to your Roblox username."),

    subdata: {
        cooldown: 3,
    },

    async execute(interaction, noblox, admin) {
        const db = admin.database();

        try {
            const snapshot = await db
                .ref("system/user_verification")
                .child(`discord_${interaction.user.id}`)
                .get();

            if (!snapshot.exists()) {
                return interaction.reply({
                    content: "You are not verified with a Roblox account.",
                    ephemeral: true
                });
            }

            const data = snapshot.val();

            if (!data.verified || !data.robloxUsername) {
                return interaction.reply({
                    content: "You are not verified with a Roblox account.",
                    ephemeral: true
                });
            }

            const guild = interaction.guild;

            if (!guild) {
                return interaction.reply({
                    content: "This command can only be used inside a server.",
                    ephemeral: true
                });
            }

            const member = await guild.members
                .fetch(interaction.user.id)
                .catch(() => null);

            if (!member) {
                return interaction.reply({
                    content: "I could not find you in this server.",
                    ephemeral: true
                });
            }

            // Don't attempt to change the server owner's nickname.
            if (member.id === guild.ownerId) {
                return interaction.reply({
                    content: "I cannot change the server owner's nickname.",
                    ephemeral: true
                });
            }

            await member.setNickname(data.robloxUsername);

            return interaction.reply({
                content: `Your nickname has been updated to **${data.robloxUsername}**.`,
                ephemeral: true
            });

        } catch (error) {
            console.error("Nickname update error:", error);

            return interaction.reply({
                content: "I couldn't update your nickname. Make sure I have permission to manage your nickname.",
                ephemeral: true
            });
        }
    }
};
