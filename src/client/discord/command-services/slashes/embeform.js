
const {
    SlashCommandBuilder,
    ChannelType,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags
} = require("discord.js");

require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("embedform")
        .setDescription(
            "Send a button that opens the embed submission form."
        )

        .addChannelOption(option =>
            option
                .setName("channel")
                .setDescription(
                    "The channel to send the embed form button to."
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
        // CHECK GUILD
        // ==========================================

        if (!interaction.guild) {
            return interaction.reply({
                content:
                    "This command can only be used in a server.",
                ephemeral: true
            });
        }

        // ==========================================
        // GET CHANNEL
        // ==========================================

        const channel =
            interaction.options.getChannel("channel");

        try {

            // ==========================================
            // CHECK CHANNEL TYPE
            // ==========================================

            if (
                channel.type !== ChannelType.GuildText
            ) {
                return interaction.reply({
                    content:
                        "Please select a normal text channel.",
                    ephemeral: true
                });
            }

            // ==========================================
            // CHECK BOT MEMBER
            // ==========================================

            const botMember =
                interaction.guild.members.me;

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

            const permissions =
                channel.permissionsFor(botMember);

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
            // CREATE BUTTON
            // ==========================================

            const button =
                new ButtonBuilder()

                    .setCustomId(
                        "embed_form_start"
                    )

                    .setLabel(
                        "Create Embed"
                    )

                    .setStyle(
                        ButtonStyle.Primary
                    );

            // ==========================================
            // CREATE ACTION ROW
            // ==========================================

            const row =
                new ActionRowBuilder()
                    .addComponents(
                        button
                    );

            // ==========================================
            // SEND BUTTON MESSAGE
            // ==========================================

            await channel.send({

                content:
                    "Click the button below to submit an embed.",

                components:
                    [row],

            });

            // ==========================================
            // SUCCESS
            // ==========================================

            return interaction.reply({
                content:
                    `Successfully sent the embed form button to ${channel}.`,
                ephemeral: true
            });

        } catch (error) {

            console.warn(
                "Embed form button error:",
                error
            );

            // ==========================================
            // ERROR RESPONSE
            // ==========================================

            if (interaction.replied || interaction.deferred) {
                return interaction.followUp({
                    content:
                        "An error occurred while sending the embed form button.",
                    flags: MessageFlags.Ephemeral
                });
            }

            return interaction.reply({
                content:
                    "An error occurred while sending the embed form button.",
                ephemeral: true
            });

        }
    }
};
