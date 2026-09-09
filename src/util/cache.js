const {
    SlashCommandBuilder
} = require("discord.js");

require("dotenv").config();

const {
    invalidateRoleBindings
} = require("../utils/cache");


module.exports = {

    data: new SlashCommandBuilder()
        .setName("bind")
        .setDescription(
            "Bind a Discord role to a Roblox group rank."
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
                    "The Discord role to bind."
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
            // CHECK @EVERYONE
            // ==========================================

            if (
                discordRole.id ===
                interaction.guild.id
            ) {

                return interaction.reply({
                    content:
                        "You cannot bind the @everyone role.",
                    ephemeral: true
                });

            }


            // ==========================================
            // GET BOT MEMBER
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
            // CHECK ROLE HIERARCHY
            // ==========================================

            if (
                discordRole.position >=
                botMember.roles.highest.position
            ) {

                return interaction.reply({
                    content:
                        "I cannot manage that Discord role because it is higher than or equal to my highest role.",
                    ephemeral: true
                });

            }


            // ==========================================
            // GET ROBLOX GROUP
            // ==========================================

            const group =
                await noblox.getGroup(groupId);


            if (!group) {

                return interaction.reply({
                    content:
                        "That Roblox group could not be found.",
                    ephemeral: true
                });

            }


            // ==========================================
            // GET ROBLOX RANKS
            // ==========================================

            const robloxRoles =
                await noblox.getRoles(groupId);


            const robloxRank =
                robloxRoles.find(
                    role => role.rank === rank
                );


            if (!robloxRank) {

                return interaction.reply({
                    content:
                        `Rank **${rank}** does not exist in **${group.name}**.`,
                    ephemeral: true
                });

            }


            // ==========================================
            // UNIQUE BINDING ID
            // ==========================================
            //
            // Group + Rank + Discord Role
            //
            // This allows multiple Discord roles
            // to be bound to the same Roblox rank.
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
            // CHECK EXISTING BINDING
            // ==========================================

            const existing =
                await ref.get();


            if (existing.exists()) {

                return interaction.reply({
                    content:
                        `**${discordRole.name}** is already bound to **${group.name} — ${robloxRank.name} (${rank})**.`,
                    ephemeral: true
                });

            }


            // ==========================================
            // SAVE BINDING
            // ==========================================

            await ref.set({

                groupId:
                    groupId,

                groupName:
                    group.name,

                rank:
                    rank,

                rankName:
                    robloxRank.name,

                discordRoleId:
                    discordRole.id,

                discordRoleName:
                    discordRole.name,

                createdBy:
                    interaction.user.id,

                createdAt:
                    Date.now()

            });


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
                    `Successfully bound **${discordRole.name}** to **${group.name} — ${robloxRank.name} (${rank})**.`,
                ephemeral: true
            });


        } catch (error) {

            console.error(
                "Bind error:",
                error
            );


            return interaction.reply({
                content:
                    "An error occurred while creating the rank binding. Make sure the Roblox group exists and Noblox is authenticated.",
                ephemeral: true
            });

        }

    }
};
