const {
    SlashCommandBuilder,
    PermissionFlagsBits
} = require("discord.js");

require("dotenv").config();

const {
    getRoleBindings
} = require("./logger/cache.js");

const {
    logUpdateVerify
} = require("./logger/verify-logger.js");


module.exports = {

    // ==========================================
    // COMMAND
    // ==========================================

    data: new SlashCommandBuilder()
        .setName("updateall")
        .setDescription(
            "Update the nicknames and roles of all verified users."
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.Administrator
        ),


    // ==========================================
    // COMMAND DATA
    // ==========================================

    subdata: {
        cooldown: 300, // 5 Minutes
    },


    // ==========================================
    // EXECUTE
    // ==========================================

    async execute(interaction, noblox, admin) {

        const db =
            admin.database();


        try {

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
            // CHECK PERMISSIONS
            // ==========================================

            if (
                !interaction.memberPermissions?.has(
                    PermissionFlagsBits.ManageGuild
                )
            ) {

                return interaction.reply({
                    content:
                        "You need the **Manage Server** permission to use this command.",
                    ephemeral: true
                });

            }


            // ==========================================
            // DEFER RESPONSE
            // ==========================================

            await interaction.deferReply({
                ephemeral: true
            });


            // ==========================================
            // GET VERIFIED USERS
            // ==========================================

            const snapshot =
                await db
                    .ref("system")
                    .child("user_verification")
                    .get();


            if (!snapshot.exists()) {

                return interaction.editReply({
                    content:
                        "There are no verified users to update."
                });

            }


            const verificationData =
                snapshot.val();


            // ==========================================
            // GET CACHED BINDINGS
            // ==========================================

            const bindings =
                await getRoleBindings(
                    admin,
                    guild.id
                );


            // ==========================================
            // ROBLOX RANK CACHE
            // ==========================================
            //
            // groupId -> robloxUserId -> rank
            //
            // This prevents duplicate Roblox API
            // requests when multiple bindings use
            // the same group/user combination.
            //
            // ==========================================

            const rankCache =
                new Map();


            // ==========================================
            // GET / CREATE VERIFIED ROLE
            // ==========================================

            let verifiedRole =
                guild.roles.cache.find(
                    role => role.name === "Verified"
                );


            if (!verifiedRole) {

                try {

                    verifiedRole =
                        await guild.roles.create({

                            name:
                                "Verified",

                            reason:
                                "Created automatically by the verification system."

                        });

                } catch (error) {

                    console.warn(
                        "Could not create Verified role:",
                        error
                    );

                    verifiedRole =
                        null;

                }

            }


            // ==========================================
            // BOT HIGHEST ROLE
            // ==========================================

            const botHighestRole =
                guild.members.me?.roles.highest;


            // ==========================================
            // STATISTICS
            // ==========================================

            let processed =
                0;

            let updated =
                0;

            let skipped =
                0;

            let notInServer =
                0;

            let errors =
                0;

            let nicknamesUpdated =
                0;

            let rolesAdded =
                0;

            let rolesRemoved =
                0;


            // ==========================================
            // PROCESS USERS
            // ==========================================

            for (
                const [
                    verificationKey,
                    data
                ]
                of Object.entries(verificationData)
            ) {

                try {

                    // ==========================================
                    // ONLY VERIFIED USERS
                    // ==========================================

                    if (
                        !data ||
                        data.verified !== true ||
                        !data.robloxUsername ||
                        !data.robloxID
                    ) {

                        skipped++;
                        continue;

                    }


                    // ==========================================
                    // GET DISCORD USER ID
                    // ==========================================

                    let discordUserId =
                        data.discordID;


                    // ==========================================
                    // FALLBACK TO FIREBASE KEY
                    // ==========================================

                    if (!discordUserId) {

                        if (
                            verificationKey.startsWith(
                                "discord_"
                            )
                        ) {

                            discordUserId =
                                verificationKey.substring(
                                    "discord_".length
                                );

                        }

                    }


                    if (!discordUserId) {

                        skipped++;
                        continue;

                    }


                    processed++;


                    // ==========================================
                    // GET MEMBER
                    // ==========================================

                    const member =
                        await guild.members
                            .fetch(discordUserId)
                            .catch(() => null);


                    if (!member) {

                        notInServer++;
                        continue;

                    }


                    // ==========================================
                    // ROLE ARRAYS
                    // ==========================================

                    const rolesToAdd =
                        [];

                    const rolesToRemove =
                        [];


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

                            if (
                                member.nickname !==
                                data.robloxUsername
                            ) {

                                await member.setNickname(
                                    data.robloxUsername
                                );

                                nicknameUpdated =
                                    true;

                                nicknamesUpdated++;

                            }

                        } catch (error) {

                            console.warn(
                                `Could not update nickname for ${member.user.tag}:`,
                                error
                            );

                        }

                    }


                    // ==========================================
                    // VERIFIED ROLE
                    // ==========================================

                    if (
                        verifiedRole &&
                        botHighestRole &&
                        verifiedRole.position <
                        botHighestRole.position
                    ) {

                        if (
                            !member.roles.cache.has(
                                verifiedRole.id
                            )
                        ) {

                            rolesToAdd.push(
                                verifiedRole
                            );

                        }

                    }


                    // ==========================================
                    // PROCESS ROLE BINDINGS
                    // ==========================================

                    for (
                        const [
                            bindingId,
                            binding
                        ]
                        of Object.entries(bindings)
                    ) {

                        try {

                            // ==========================================
                            // BINDING VALUES
                            // ==========================================

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
                            // GET ROBLOX RANK
                            // ==========================================

                            let userRank;

                            let cachedGroup =
                                rankCache.get(
                                    groupId
                                );


                            if (!cachedGroup) {

                                cachedGroup =
                                    new Map();

                                rankCache.set(
                                    groupId,
                                    cachedGroup
                                );

                            }


                            if (
                                cachedGroup.has(
                                    Number(data.robloxID)
                                )
                            ) {

                                userRank =
                                    cachedGroup.get(
                                        Number(data.robloxID)
                                    );

                            } else {

                                userRank =
                                    await noblox.getRankInGroup(
                                        groupId,
                                        Number(data.robloxID)
                                    );


                                cachedGroup.set(
                                    Number(data.robloxID),
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

                                const userLeftGroup =
                                    userRank === 0;


                                const shouldRemove =
                                    userLeftGroup ||
                                    binding.removeOnLeave === true;


                                if (
                                    shouldRemove &&
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
                                `Failed to process binding ${bindingId} for ${data.robloxUsername}:`,
                                error
                            );

                        }

                    }


                    // ==========================================
                    // REMOVE DUPLICATE ROLES
                    // ==========================================

                    const uniqueRolesToAdd =
                        [
                            ...new Map(
                                rolesToAdd.map(
                                    role => [
                                        role.id,
                                        role
                                    ]
                                )
                            ).values()
                        ];


                    const uniqueRolesToRemove =
                        [
                            ...new Map(
                                rolesToRemove.map(
                                    role => [
                                        role.id,
                                        role
                                    ]
                                )
                            ).values()
                        ];


                    // ==========================================
                    // ADD ROLES
                    // ==========================================

                    for (
                        const role
                        of uniqueRolesToAdd
                    ) {

                        try {

                            if (
                                !botHighestRole ||
                                role.position >=
                                botHighestRole.position
                            ) {

                                console.warn(
                                    `Cannot add role ${role.name} to ${data.robloxUsername}: role is higher than or equal to the bot's highest role.`
                                );

                                continue;

                            }


                            if (
                                !member.roles.cache.has(
                                    role.id
                                )
                            ) {

                                await member.roles.add(
                                    role
                                );

                                rolesAdded++;

                            }

                        } catch (error) {

                            console.warn(
                                `Failed to add role ${role.name} to ${data.robloxUsername}:`,
                                error
                            );

                        }

                    }


                    // ==========================================
                    // REMOVE ROLES
                    // ==========================================

                    for (
                        const role
                        of uniqueRolesToRemove
                    ) {

                        try {

                            if (
                                !botHighestRole ||
                                role.position >=
                                botHighestRole.position
                            ) {

                                console.warn(
                                    `Cannot remove role ${role.name} from ${data.robloxUsername}: role is higher than or equal to the bot's highest role.`
                                );

                                continue;

                            }


                            if (
                                member.roles.cache.has(
                                    role.id
                                )
                            ) {

                                await member.roles.remove(
                                    role
                                );

                                rolesRemoved++;

                            }

                        } catch (error) {

                            console.warn(
                                `Failed to remove role ${role.name} from ${data.robloxUsername}:`,
                                error
                            );

                        }

                    }


                    // ==========================================
                    // USER WAS UPDATED
                    // ==========================================

                    if (
                        nicknameUpdated ||
                        uniqueRolesToAdd.length > 0 ||
                        uniqueRolesToRemove.length > 0
                    ) {

                        updated++;

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
                                "updateall",

                            discordUser:
                                discordUserId,

                            robloxUsername:
                                data.robloxUsername,

                            robloxId:
                                data.robloxID,

                            nicknameChanged:
                                nicknameUpdated,

                            rolesAdded:
                                uniqueRolesToAdd.map(
                                    role => role.id
                                ),

                            rolesRemoved:
                                uniqueRolesToRemove.map(
                                    role => role.id
                                )
                        }
                    );


                } catch (error) {

                    errors++;

                    console.warn(
                        `Failed to update verified user ${verificationKey}:`,
                        error
                    );

                }

            }


            // ==========================================
            // FINAL RESPONSE
            // ==========================================

            return interaction.editReply({

                content:
                    `**Update All Complete**` +

                    `\n\n` +

                    `**Verified Users Processed:** ${processed}` +

                    `\n**Users Updated:** ${updated}` +

                    `\n**Nicknames Updated:** ${nicknamesUpdated}` +

                    `\n**Roles Added:** ${rolesAdded}` +

                    `\n**Roles Removed:** ${rolesRemoved}` +

                    `\n**Not In Server:** ${notInServer}` +

                    `\n**Skipped:** ${skipped}` +

                    `\n**Errors:** ${errors}`

            });


        } catch (error) {

            console.error(
                "Updateall command error:",
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
                            "updateall_error",

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
                    "Failed to log updateall error:",
                    loggerError
                );

            }


            // ==========================================
            // ERROR RESPONSE
            // ==========================================

            if (
                interaction.deferred ||
                interaction.replied
            ) {

                return interaction.editReply({
                    content:
                        "I couldn't update the verified users. Please try again later."
                });

            }


            return interaction.reply({
                content:
                    "I couldn't update the verified users. Please try again later.",
                ephemeral: true
            });

        }

    }

};
