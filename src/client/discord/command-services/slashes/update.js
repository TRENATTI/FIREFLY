const {
    SlashCommandBuilder
} = require("discord.js");

require("dotenv").config();

const {
    getRoleBindings
} = require("../utils/cache");

const {
    logUpdateVerify
} = require("../utils/logger");


module.exports = {

    data: new SlashCommandBuilder()
        .setName("update")
        .setDescription(
            "Update your Discord nickname and roles from your Roblox account."
        ),

    subdata: {
        cooldown: 3,
    },


    async execute(interaction, noblox, admin) {

        const db =
            admin.database();


        try {

            // ==========================================
            // CHECK VERIFICATION
            // ==========================================

            const snapshot =
                await db
                    .ref("system")
                    .child("user_verification")
                    .child(
                        `discord_${interaction.user.id}`
                    )
                    .get();


            if (!snapshot.exists()) {

                return interaction.reply({
                    content:
                        "You are not verified with a Roblox account.",
                    ephemeral: true
                });

            }


            const data =
                snapshot.val();


            if (
                !data.verified ||
                !data.robloxUsername ||
                !data.robloxID
            ) {

                return interaction.reply({
                    content:
                        "You are not verified with a Roblox account.",
                    ephemeral: true
                });

            }


            // ==========================================
            // CHECK GUILD
            // ==========================================

            const guild =
                interaction.guild;


            if (!guild) {

                return interaction.reply({
                    content:
                        "This command can only be used inside a server.",
                    ephemeral: true
                });

            }


            // ==========================================
            // GET MEMBER
            // ==========================================

            const member =
                await guild.members
                    .fetch(interaction.user.id)
                    .catch(() => null);


            if (!member) {

                return interaction.reply({
                    content:
                        "I could not find you in this server.",
                    ephemeral: true
                });

            }


            // ==========================================
            // UPDATE NICKNAME
            // ==========================================

            let nicknameUpdated =
                false;


            if (
                member.id !==
                guild.ownerId
            ) {

                try {

                    await member.setNickname(
                        data.robloxUsername
                    );

                    nicknameUpdated =
                        true;

                } catch (error) {

                    console.warn(
                        "Could not update nickname:",
                        error
                    );

                }

            }


            // ==========================================
            // GET CACHED BINDINGS
            // ==========================================

            const bindings =
                await getRoleBindings(
                    admin,
                    guild.id
                );


            // ==========================================
            // ROLE ARRAYS
            // ==========================================

            const rolesToAdd = [];
            const rolesToRemove = [];


            // ==========================================
            // ROBLOX RANK CACHE
            // ==========================================
            //
            // groupId -> rank
            //
            // This prevents multiple API calls
            // for bindings belonging to the same
            // Roblox group.
            // ==========================================

            const rankCache =
                new Map();


            // ==========================================
            // PROCESS BINDINGS
            // ==========================================

            for (
                const [
                    bindingId,
                    binding
                ]
                of Object.entries(bindings)
            ) {

                try {

                    const groupId =
                        Number(
                            binding.groupId
                        );

                    const requiredRank =
                        Number(
                            binding.rank
                        );

                    const discordRoleId =
                        binding.discordRoleId;


                    // ==========================================
                    // GET DISCORD ROLE
                    // ==========================================

                    const discordRole =
                        guild.roles.cache.get(
                            discordRoleId
                        );


                    if (!discordRole) {

                        console.warn(
                            `Discord role ${discordRoleId} no longer exists.`
                        );

                        continue;

                    }


                    // ==========================================
                    // GET ROBLOX RANK FROM CACHE
                    // ==========================================

                    let userRank;


                    if (
                        rankCache.has(
                            groupId
                        )
                    ) {

                        userRank =
                            rankCache.get(
                                groupId
                            );

                    } else {

                        userRank =
                            await noblox.getRankInGroup(
                                groupId,
                                Number(data.robloxID)
                            );


                        rankCache.set(
                            groupId,
                            userRank
                        );

                    }


                    // ==========================================
                    // RANK MATCHES
                    // ==========================================

                    if (
                        userRank ===
                        requiredRank
                    ) {

                        if (
                            !member.roles.cache.has(
                                discordRoleId
                            )
                        ) {

                            rolesToAdd.push(
                                discordRole
                            );

                        }

                    }


                    // ==========================================
                    // RANK DOES NOT MATCH
                    // ==========================================

                    else {

                        if (
                            member.roles.cache.has(
                                discordRoleId
                            )
                        ) {

                            rolesToRemove.push(
                                discordRole
                            );

                        }

                    }


                } catch (error) {

                    console.warn(
                        `Failed to process binding ${bindingId}:`,
                        error
                    );

                }

            }


            // ==========================================
            // ADD ROLES
            // ==========================================

            for (
                const role
                of rolesToAdd
            ) {

                try {

                    if (
                        role.position >=
                        guild.members.me
                            .roles.highest.position
                    ) {

                        console.warn(
                            `Cannot add role ${role.name}: role is higher than or equal to the bot's highest role.`
                        );

                        continue;

                    }


                    await member.roles.add(
                        role
                    );


                } catch (error) {

                    console.warn(
                        `Failed to add role ${role.name}:`,
                        error
                    );

                }

            }


            // ==========================================
            // REMOVE ROLES
            // ==========================================

            for (
                const role
                of rolesToRemove
            ) {

                try {

                    if (
                        role.position >=
                        guild.members.me
                            .roles.highest.position
                    ) {

                        console.warn(
                            `Cannot remove role ${role.name}: role is higher than or equal to my highest role.`
                        );

                        continue;

                    }


                    await member.roles.remove(
                        role
                    );


                } catch (error) {

                    console.warn(
                        `Failed to remove role ${role.name}:`,
                        error
                    );

                }

            }


            // ==========================================
            // LOG UPDATE
            // ==========================================

            await logUpdateVerify(
                interaction.client,
                admin,
                {
                    guildId:
                        guild.id,

                    type:
                        "update",

                    discordUser:
                        interaction.user.id,

                    robloxUsername:
                        data.robloxUsername,

                    robloxId:
                        data.robloxID,

                    nicknameChanged:
                        nicknameUpdated,

                    rolesAdded:
                        rolesToAdd.map(
                            role => role.id
                        ),

                    rolesRemoved:
                        rolesToRemove.map(
                            role => role.id
                        )
                }
            );


            // ==========================================
            // RESPONSE NAMES
            // ==========================================

            const addedNames =
                rolesToAdd.map(
                    role => role.name
                );


            const removedNames =
                rolesToRemove.map(
                    role => role.name
                );


            // ==========================================
            // RESPONSE
            // ==========================================

            let roleMessage =
                "";


            if (
                addedNames.length > 0
            ) {

                roleMessage +=
                    `\n\n**Roles Added:** ${addedNames
                        .map(
                            name => `\`${name}\``
                        )
                        .join(", ")}`;

            }


            if (
                removedNames.length > 0
            ) {

                roleMessage +=
                    `\n\n**Roles Removed:** ${removedNames
                        .map(
                            name => `\`${name}\``
                        )
                        .join(", ")}`;

            }


            if (
                addedNames.length === 0 &&
                removedNames.length === 0
            ) {

                roleMessage =
                    "\n\nNo role changes were required.";

            }


            // ==========================================
            // SUCCESS
            // ==========================================

            return interaction.reply({
                content:
                    `Your Roblox information has been updated.` +
                    `\n\n**Roblox Username:** ${data.robloxUsername}` +
                    roleMessage,
                ephemeral: true
            });


        } catch (error) {

            console.error(
                "Update command error:",
                error
            );


            // ==========================================
            // LOG ERROR
            // ==========================================

            try {

                await logUpdateVerify(
                    interaction.client,
                    admin,
                    {
                        guildId:
                            interaction.guild?.id,

                        type:
                            "error",

                        discordUser:
                            interaction.user.id,

                        error:
                            error.stack ||
                            error.message ||
                            String(error)
                    }
                );

            } catch (loggerError) {

                console.error(
                    "Failed to log update error:",
                    loggerError
                );

            }


            // ==========================================
            // ERROR RESPONSE
            // ==========================================

            return interaction.reply({
                content:
                    "I couldn't update your Roblox information. Please try again later.",
                ephemeral: true
            });

        }

    }
};
