const {
    SlashCommandBuilder
} = require("discord.js");

require("dotenv").config();

const {
    invalidateRoleBindings
} = require("../logger/cache.js");


module.exports = {

    data: new SlashCommandBuilder()
        .setName("unbind")
        .setDescription(
            "Remove a Discord role from a Roblox group rank binding."
        )

        .addIntegerOption(option =>
            option
                .setName("group")
                .setDescription(
                    "The Roblox Group ID."
                )
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName("rank")
                .setDescription(
                    "The Roblox rank number."
                )
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(255)
        )

        .addRoleOption(option =>
            option
                .setName("discord-role")
                .setDescription(
                    "The Discord role to unbind."
                )
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
            interaction.user.id !== "170639211182030850" &&
            interaction.user.id !== "463516784578789376" &&
            interaction.user.id !== "206090047462703104" &&
            interaction.user.id !== "1154775391597240391" &&
            interaction.user.id !== "175922772923383808"
        ) {

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
                    "This command can only be used inside a server.",
                ephemeral: true
            });

        }


        // ==========================================
        // GET OPTIONS
        // ==========================================

        const groupId =
            interaction.options.getInteger("group");

        const rank =
            interaction.options.getInteger("rank");

        const discordRole =
            interaction.options.getRole(
                "discord-role"
            );


        try {

            // ==========================================
            // CREATE BINDING ID
            // ==========================================

            const bindingId =
                `${groupId}_${rank}_${discordRole.id}`;


            // ==========================================
            // FIREBASE REFERENCE
            // ==========================================

            const ref = admin
                .database()
                .ref("system")
                .child("role_bindings")
                .child(interaction.guild.id)
                .child(bindingId);


            // ==========================================
            // CHECK BINDING
            // ==========================================

            const snapshot =
                await ref.get();


            if (!snapshot.exists()) {

                return interaction.reply({
                    content:
                        `No binding exists for **${discordRole.name}** with Roblox Group **${groupId}** and Rank **${rank}**.`,
                    ephemeral: true
                });

            }


            const binding =
                snapshot.val();


            // ==========================================
            // DELETE
            // ==========================================

            await ref.remove();


            // ==========================================
            // CLEAR CACHE
            // ==========================================

            invalidateRoleBindings(
                interaction.guild.id
            );


            // ==========================================
            // SUCCESS
            // ==========================================

            return interaction.reply({
                content:
                    `Successfully unbound **${discordRole.name}** from **${binding.groupName} — ${binding.rankName} (${binding.rank})**.`,
                ephemeral: true
            });


        } catch (error) {

            console.error(
                "Unbind error:",
                error
            );


            return interaction.reply({
                content:
                    "An error occurred while removing the rank binding.",
                ephemeral: true
            });

        }

    }
};
