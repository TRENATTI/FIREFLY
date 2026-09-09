const {
    SlashCommandBuilder,
    ChannelType
} = require("discord.js");

require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("logchannel")
        .setDescription(
            "Bind a channel for verification and update logs."
        )

        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription(
                    "The channel to use for verification/update logs."
                )
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)
        ),

    subdata: {
        cooldown: 3,
    },

    async execute(interaction, noblox, admin) {

        // ==========================================
        // OWNER AUTHORIZATION
        // ==========================================

        if (
            interaction.user.id == "170639211182030850" ||
            interaction.user.id == "463516784578789376" ||
            interaction.user.id == "206090047462703104" ||
            interaction.user.id == "1154775391597240391" ||
            interaction.user.id == "175922772923383808"
        ) {
            // Authorized
        } else {
            return interaction.reply({
                content:
                    `Sorry ${interaction.user}, but only the owners can run that command!`,
                ephemeral: true
            });
        }


        // ==========================================
        // DATABASE
        // ==========================================

        const db = admin.database();


        // ==========================================
        // GET CHANNEL
        // ==========================================

        const channel = interaction.options.getChannel("channel");


        try {

            // ==========================================
            // CHECK CHANNEL TYPE
            // ==========================================

            if (channel.type !== ChannelType.GuildText) {
                return interaction.reply({
                    content:
                        "Please select a normal text channel.",
                    ephemeral: true
                });
            }


            // ==========================================
            // CHECK BOT MEMBER
            // ==========================================

            const botMember = interaction.guild.members.me;

            if (!botMember) {
                return interaction.reply({
                    content:
                        "I could not find my bot member in this server.",
                    ephemeral: true
                });
            }


            // ==========================================
            // CHECK PERMISSIONS
            // ==========================================

            const permissions = channel.permissionsFor(botMember);

            if (
                !permissions ||
                !permissions.has("ViewChannel") ||
                !permissions.has("SendMessages") ||
                !permissions.has("EmbedLinks")
            ) {
                return interaction.reply({
                    content:
                        "I need View Channel, Send Messages, and Embed Links permissions in that channel.",
                    ephemeral: true
                });
            }


            // ==========================================
            // FIREBASE REFERENCE
            // ==========================================

            const ref = db
                .ref("system")
                .child("log_channels")
                .child(interaction.guild.id)
                .child("updateVerify");


            // ==========================================
            // SAVE LOG CHANNEL
            // ==========================================

            await ref.set({
                channelId: channel.id,
                channelName: channel.name,
                guildId: interaction.guild.id,
                updatedBy: interaction.user.id,
                updatedAt: Date.now()
            });


            // ==========================================
            // SUCCESS
            // ==========================================

            return interaction.reply({
                content:
                    `Successfully bound ${channel} as the verification/update log channel.`,
                ephemeral: true
            });


        } catch (error) {

            console.error(
                "Log channel binding error:",
                error
            );

            return interaction.reply({
                content:
                    "An error occurred while binding the log channel.",
                ephemeral: true
            });

        }
    }
};