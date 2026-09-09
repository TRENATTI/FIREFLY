const {
    SlashCommandBuilder
} = require("discord.js");

require("dotenv").config();

module.exports = {
    data: new SlashCommandBuilder()
        .setName("unbind")
        .setDescription("Remove a Roblox rank to Discord role binding.")

        .addIntegerOption(option =>
            option
                .setName("group")
                .setDescription("The Roblox Group ID.")
                .setRequired(true)
        )

        .addIntegerOption(option =>
            option
                .setName("rank")
                .setDescription("The Roblox rank number.")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(255)
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
                content: `Sorry ${interaction.user}, but only the owners can run that command!`,
                ephemeral: true
            });
        }


        // ==========================================
        // DATABASE
        // ==========================================

        const db = admin.database();


        // ==========================================
        // GET COMMAND OPTIONS
        // ==========================================

        const groupId = interaction.options.getInteger("group");
        const rank = interaction.options.getInteger("rank");


        try {

            // ==========================================
            // CHECK ROBLOX GROUP
            // ==========================================

            const group = await noblox.getGroup(groupId);

            if (!group) {
                return interaction.reply({
                    content: "That Roblox group could not be found.",
                    ephemeral: true
                });
            }


            // ==========================================
            // CREATE BINDING ID
            // ==========================================

            const bindingId = `${groupId}_${rank}`;


            // ==========================================
            // FIREBASE REFERENCE
            // ==========================================

            const ref = db
                .ref("system")
                .child("role_bindings")
                .child(interaction.guild.id)
                .child(bindingId);


            // ==========================================
            // CHECK IF BINDING EXISTS
            // ==========================================

            const snapshot = await ref.get();

            if (!snapshot.exists()) {
                return interaction.reply({
                    content:
                        `No binding exists for **${group.name} — Rank ${rank}**.`,
                    ephemeral: true
                });
            }


            // ==========================================
            // GET BINDING DATA
            // ==========================================

            const binding = snapshot.val();


            // ==========================================
            // REMOVE BINDING
            // ==========================================

            await ref.remove();


            // ==========================================
            // SUCCESS
            // ==========================================

            return interaction.reply({
                content:
                    `Successfully unbound **${binding.discordRoleName}** from **${group.name} — Rank ${rank}**.`,
                ephemeral: true
            });


        } catch (error) {

            console.error("Unbind error:", error);

            return interaction.reply({
                content:
                    "An error occurred while removing the rank binding.",
                ephemeral: true
            });

        }
    }
};
