const {
    SlashCommandBuilder,
    ContainerBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ButtonStyle,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ComponentType,
    EmbedBuilder
} = require("discord.js");

require("dotenv").config();

const crypto = require("crypto");
const https = require("https");

const {
    verify_container
} = require("./embeds/verify.js");

const {
    getRoleBindings
} = require("./logger/cache.js");

const {
    logUpdateVerify
} = require("./logger/verify-logger.js");

// ============================================================
// ROBLOX AVATAR
// ============================================================

function fetchAvatar(userId) {

    return new Promise((resolve) => {

        const url =
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?` +
            `userIds=${userId}` +
            `&size=150x150` +
            `&format=Png` +
            `&isCircular=true`;

        https
            .get(url, (res) => {

                let data = "";

                res.on("data", (chunk) => {
                    data += chunk;
                });

                res.on("end", () => {

                    try {

                        const json =
                            JSON.parse(data);

                        const imageUrl =
                            json.data?.[0]?.imageUrl || null;

                        resolve(imageUrl);

                    } catch {

                        resolve(null);

                    }

                });

            })
            .on("error", () => {

                resolve(null);

            });

    });

}

// ============================================================
// ROLE BINDING SYSTEM
// ============================================================
//
// Uses the same Firebase role-binding system as /update.
//
// Supports:
//
// - entireGroup
// - rank
// - removeOnLeave
// - getRoleBindings cache
// - per-group Roblox rank cache
// - Verified role
// - Discord role hierarchy checks
//
// ============================================================

async function updateRolesForVerifiedUser(
    interaction,
    admin,
    noblox,
    robloxId
) {

    const guild =
        interaction.guild;

    if (!guild) {

        return {
            rolesAdded: [],
            rolesRemoved: []
        };

    }

    // ========================================================
    // GET CACHED ROLE BINDINGS
    // ========================================================

    const bindings =
        await getRoleBindings(
            admin,
            guild.id
        );

    const rolesToAdd = [];
    const rolesToRemove = [];

    // ========================================================
    // BOT MEMBER
    // ========================================================

    const botMember =
        guild.members.me ||
        await guild.members.fetch(
            interaction.client.user.id
        ).catch(() => null);

    if (!botMember) {

        console.warn(
            "Could not find the bot member in the guild."
        );

        return {
            rolesAdded: [],
            rolesRemoved: []
        };

    }

    // ========================================================
    // VERIFIED ROLE
    // ========================================================

    let verifiedRole =
        guild.roles.cache.find(
            role =>
                role.name === "Verified"
        );

    // ========================================================
    // CREATE VERIFIED ROLE IF NEEDED
    // ========================================================

    if (!verifiedRole) {

        try {

            verifiedRole =
                await guild.roles.create({

                    name: "Verified",

                    reason:
                        "Created automatically by the verification system."

                });

        } catch (error) {

            console.warn(
                "Could not create Verified role:",
                error
            );

            verifiedRole = null;

        }

    }

    // ========================================================
    // ADD VERIFIED ROLE
    // ========================================================

    if (verifiedRole) {

        if (
            verifiedRole.position <
            botMember.roles.highest.position
        ) {

            if (
                !interaction.member.roles.cache.has(
                    verifiedRole.id
                )
            ) {

                rolesToAdd.push(
                    verifiedRole
                );

            }

        } else {

            console.warn(
                "Cannot add Verified role: role is higher than or equal to the bot's highest role."
            );

        }

    }

    // ========================================================
    // ROBLOX RANK CACHE
    // ========================================================
    //
    // groupId -> rank
    //
    // Prevents multiple Roblox API calls when several
    // bindings use the same group.
    //
    // ========================================================

    const rankCache =
        new Map();

    // ========================================================
    // PROCESS ROLE BINDINGS
    // ========================================================

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

            const discordRoleId =
                binding.discordRoleId;

            // =================================================
            // GET DISCORD ROLE
            // =================================================

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

            // =================================================
            // GET USER RANK
            // =================================================

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
                        Number(robloxId)
                    );

                rankCache.set(
                    groupId,
                    userRank
                );

            }

            // =================================================
            // ENTIRE GROUP BINDING
            // =================================================

            if (
                binding.entireGroup === true
            ) {

                // =============================================
                // USER IS IN GROUP
                // =============================================

                if (
                    userRank > 0
                ) {

                    if (
                        !interaction.member.roles.cache.has(
                            discordRoleId
                        )
                    ) {

                        rolesToAdd.push(
                            discordRole
                        );

                    }

                }

                // =============================================
                // USER IS NOT IN GROUP
                // =============================================

                else {

                    const shouldRemove =
                        binding.removeOnLeave === true ||
                        userRank === 0;

                    if (
                        shouldRemove &&
                        interaction.member.roles.cache.has(
                            discordRoleId
                        )
                    ) {

                        rolesToRemove.push(
                            discordRole
                        );

                    }

                }

                continue;

            }

            // =================================================
            // RANK-SPECIFIC BINDING
            // =================================================

            const requiredRank =
                Number(
                    binding.rank
                );

            // =================================================
            // RANK MATCHES
            // =================================================

            if (
                userRank ===
                requiredRank
            ) {

                if (
                    !interaction.member.roles.cache.has(
                        discordRoleId
                    )
                ) {

                    rolesToAdd.push(
                        discordRole
                    );

                }

            }

            // =================================================
            // RANK DOES NOT MATCH
            // =================================================

            else {

                const userLeftGroup =
                    userRank === 0;

                const shouldRemove =
                    userLeftGroup ||
                    binding.removeOnLeave === true;

                if (
                    shouldRemove &&
                    interaction.member.roles.cache.has(
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

    // ========================================================
    // ADD ROLES
    // ========================================================

    for (
        const role
        of rolesToAdd
    ) {

        try {

            if (
                role.position >=
                botMember.roles.highest.position
            ) {

                console.warn(
                    `Cannot add role ${role.name}: role is higher than or equal to the bot's highest role.`
                );

                continue;

            }

            await interaction.member.roles.add(
                role
            );

        } catch (error) {

            console.warn(
                `Failed to add role ${role.name}:`,
                error
            );

        }

    }

    // ========================================================
    // REMOVE ROLES
    // ========================================================

    for (
        const role
        of rolesToRemove
    ) {

        try {

            if (
                role.position >=
                botMember.roles.highest.position
            ) {

                console.warn(
                    `Cannot remove role ${role.name}: role is higher than or equal to my highest role.`
                );

                continue;

            }

            await interaction.member.roles.remove(
                role
            );

        } catch (error) {

            console.warn(
                `Failed to remove role ${role.name}:`,
                error
            );

        }

    }

    return {
        rolesAdded: rolesToAdd,
        rolesRemoved: rolesToRemove
    };

}

// ============================================================
// COMMAND
// ============================================================

module.exports = {

    data: new SlashCommandBuilder()

        .setName("verify")

        .setDescription(
            "Verify your account with our services."
        )

        .addBooleanOption(option =>
            option
                .setName("reverify")
                .setDescription(
                    "Force a new verification session."
                )
                .setRequired(false)
        ),

    subdata: {
        cooldown: 3,
    },

    async execute(
        interaction,
        noblox,
        admin
    ) {

        const db =
            admin.database();

        const reverify =
            interaction.options.getBoolean(
                "reverify"
            ) ?? false;

        const discordId =
            interaction.user.id;

        const guild =
            interaction.guild;

        if (!guild) {

            return interaction.reply({
                content:
                    "This command can only be used inside a server.",
                ephemeral: true
            });

        }

        const guildId =
            guild.id;

        // ====================================================
        // FIREBASE USER REFERENCE
        // ====================================================

        const ref =
            db
                .ref("system")
                .child("user_verification")
                .child(`discord_${discordId}`);

        try {

            // =================================================
            // CHECK EXISTING FIREBASE RECORD
            // =================================================

            const existingSnapshot =
                await ref.get();

            if (
                existingSnapshot.exists()
            ) {

                const existing =
                    existingSnapshot.val();

                if (
                    existing.verified === true &&
                    existing.robloxUsername &&
                    !reverify
                ) {

                    return interaction.reply({

                        content:
                            `You’ve already linked your Discord account to **${existing.robloxUsername}**. Try again with the verify command's reverify field set to **true** if you wish to reverify.`,

                        ephemeral: true

                    });

                }

            }

            // =================================================
            // GENERATE WEBSITE STATE
            // =================================================

            const state =
                crypto.randomBytes(32)
                    .toString("hex");

            // =================================================
            // CREATE / RESET VERIFICATION SESSION
            // =================================================

            await ref.update({

                verificationGuildID:
                    guildId,

                verified:
                    false,

                statecode:
                    state,

                discordID:
                    discordId,

                verificationMethod:
                    null,

                robloxID:
                    null,

                robloxUsername:
                    null,

                robloxDisplayName:
                    null,

                robloxProfile:
                    null,

                verificationCode:
                    null,

                verifiedAt:
                    null,

            });

            // =================================================
            // INITIAL VERIFICATION MESSAGE
            // =================================================

            await interaction.reply({

                components: [

                    new ContainerBuilder()

                        .setAccentColor(
                            0x0099ff
                        )

                        // =====================================
                        // HEADER
                        // =====================================

                        .addTextDisplayComponents(
                            (textDisplay) =>
                                textDisplay
                                    .setContent(
                                        "# Verify"
                                    )
                        )

                        .addSeparatorComponents(
                            (separator) =>
                                separator
                        )

                        // =====================================
                        // WEBSITE
                        // =====================================

                        .addSectionComponents(
                            (section) =>
                                section

                                    .addTextDisplayComponents(
                                        (textDisplay) =>
                                            textDisplay
                                                .setContent(
                                                    "## Roblox Account Verifier\n" +
                                                    "Verify your Roblox account using our website."
                                                )
                                    )

                                    .setButtonAccessory(
                                        (button) =>
                                            button

                                                .setLabel(
                                                    "Verify with Website"
                                                )

                                                .setStyle(
                                                    ButtonStyle.Link
                                                )

                                                .setURL(
                                                    `https://auth.trenati.dev/?state=${encodeURIComponent(state)}`
                                                )
                                    )
                        )

                        .addSeparatorComponents(
                            (separator) =>
                                separator
                        )

                        // =====================================
                        // USER DESCRIPTION
                        // =====================================

                        .addSectionComponents(
                            (section) =>
                                section

                                    .addTextDisplayComponents(
                                        (textDisplay) =>
                                            textDisplay
                                                .setContent(
                                                    "## User Description\n" +
                                                    "Verify by placing a verification code in your Roblox About Me."
                                                )
                                    )

                                    .setButtonAccessory(
                                        (button) =>
                                            button

                                                .setCustomId(
                                                    "verify_description"
                                                )

                                                .setLabel(
                                                    "Verify with User Description"
                                                )

                                                .setStyle(
                                                    ButtonStyle.Primary
                                                )
                                    )
                        ),

                ],

                ephemeral:
                    true,

                flags:
                    MessageFlags.IsComponentsV2,

                withResponse:
                    false,

            });

            // =================================================
            // GET MESSAGE
            // =================================================

            const message =
                await interaction.fetchReply();

            // =================================================
            // WAIT FOR DESCRIPTION BUTTON
            // =================================================

            const descriptionButton =
                await message
                    .awaitMessageComponent({

                        componentType:
                            ComponentType.Button,

                        time:
                            120000,

                        filter:
                            (componentInteraction) =>
                                componentInteraction.user.id ===
                                    discordId &&
                                componentInteraction.customId ===
                                    "verify_description",

                    })
                    .catch(() => null);

            // =================================================
            // WEBSITE VERIFICATION
            //
            // No button means the user likely continued
            // through the website.
            // =================================================

            if (!descriptionButton) {

                return;

            }

            // =================================================
            // DESCRIPTION MODAL
            // =================================================

            const modal =
                new ModalBuilder()

                    .setCustomId(
                        "verify_description_modal"
                    )

                    .setTitle(
                        "Verify with User Description"
                    );

            const usernameInput =
                new TextInputBuilder()

                    .setCustomId(
                        "roblox_username"
                    )

                    .setLabel(
                        "Roblox Username"
                    )

                    .setPlaceholder(
                        "Enter your Roblox username"
                    )

                    .setStyle(
                        TextInputStyle.Short
                    )

                    .setRequired(
                        true
                    )

                    .setMinLength(
                        3
                    )

                    .setMaxLength(
                        20
                    );

            modal.addComponents(
                new ActionRowBuilder()
                    .addComponents(
                        usernameInput
                    )
            );

            await descriptionButton.showModal(
                modal
            );

            // =================================================
            // WAIT FOR MODAL
            // =================================================

            const modalSubmit =
                await descriptionButton
                    .awaitModalSubmit({

                        time:
                            120000,

                        filter:
                            (modalInteraction) =>
                                modalInteraction.user.id ===
                                    discordId &&
                                modalInteraction.customId ===
                                    "verify_description_modal",

                    })
                    .catch(() => null);

            if (!modalSubmit) {

                return;

            }

            await modalSubmit.deferReply({
                ephemeral: true,
            });

            // =================================================
            // GET ROBLOX USERNAME
            // =================================================

            const username =
                modalSubmit
                    .fields
                    .getTextInputValue(
                        "roblox_username"
                    )
                    .trim();

            // =================================================
            // GET ROBLOX USER ID
            // =================================================

            let userId;

            try {

                userId =
                    await noblox.getIdFromUsername(
                        username
                    );

            } catch {

                return modalSubmit.editReply({

                    content:
                        `Could not find Roblox user **"${username}"**.`,

                });

            }

            // =================================================
            // GENERATE DESCRIPTION CODE
            // =================================================

            const verificationCode =
                `VER-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;

            // =================================================
            // UPDATE FIREBASE RECORD
            // =================================================

            await ref.update({

                verificationMethod:
                    "description",

                robloxID:
                    String(userId),

                robloxUsername:
                    username,

                verificationCode:
                    verificationCode,

                verified:
                    false,

            });

            // =================================================
            // AVATAR
            // =================================================

            const avatarUrl =
                await fetchAvatar(
                    userId
                );

            // =================================================
            // DESCRIPTION VERIFICATION EMBED
            // =================================================

            const verifyEmbed =
                new EmbedBuilder()

                    .setTitle(
                        "Verification Process"
                    )

                    .setColor(
                        "DarkBlue"
                    )

                    .setDescription(
                        `To verify that **${username}** is your Roblox account:\n\n` +
                        `1. Visit [**your profile**](https://www.roblox.com/users/${userId}/profile)\n` +
                        `2. Add this code to your **About Me**:\n` +
                        `\`\`\`${verificationCode}\`\`\`\n` +
                        `3. Click **Confirm** below once you've done it.`
                    )

                    .setThumbnail(
                        avatarUrl
                    )

                    .setFooter({

                        text:
                            interaction.client.user.username,

                        icon_url:
                            interaction.client.user.displayAvatarURL({

                                format:
                                    "png",

                                dynamic:
                                    true,

                            }),

                    })

                    .setTimestamp();

            // =================================================
            // CONFIRM BUTTON
            // =================================================

            const confirmRow =
                new ActionRowBuilder()
                    .addComponents(

                        new ButtonBuilder()

                            .setCustomId(
                                "verify_confirm"
                            )

                            .setLabel(
                                "Confirm"
                            )

                            .setStyle(
                                ButtonStyle.Primary
                            )

                    );

            await modalSubmit.editReply({

                embeds:
                    [verifyEmbed],

                components:
                    [confirmRow],

            });

            // =================================================
            // GET DESCRIPTION MESSAGE
            // =================================================

            const descriptionMessage =
                await modalSubmit.fetchReply();

            // =================================================
            // WAIT FOR CONFIRM
            // =================================================

            const confirmation =
                await descriptionMessage
                    .awaitMessageComponent({

                        componentType:
                            ComponentType.Button,

                        time:
                            60000,

                        filter:
                            (componentInteraction) =>
                                componentInteraction.user.id ===
                                    discordId &&
                                componentInteraction.customId ===
                                    "verify_confirm",

                    })
                    .catch(() => null);

            // =================================================
            // TIMEOUT
            // =================================================

            if (!confirmation) {

                await ref
                    .update({

                        verificationMethod:
                            null,

                        robloxID:
                            null,

                        robloxUsername:
                            null,

                        verificationCode:
                            null,

                    })
                    .catch(() => {});

                const timeoutEmbed =
                    new EmbedBuilder()

                        .setTitle(
                            "Timed Out"
                        )

                        .setDescription(
                            "You didn’t confirm in time. Start again with `/verify`."
                        )

                        .setColor(
                            "#9D4D4D"
                        )

                        .setFooter({

                            text:
                                interaction.client.user.username,

                            icon_url:
                                interaction.client.user.displayAvatarURL({

                                    format:
                                        "png",

                                    dynamic:
                                        true,

                                }),

                        })

                        .setTimestamp();

                return modalSubmit.editReply({

                    embeds:
                        [timeoutEmbed],

                    components:
                        [],

                });

            }

            // =================================================
            // DISABLE CONFIRM BUTTON
            // =================================================

            if (
                !confirmation.deferred &&
                !confirmation.replied
            ) {

                await confirmation
                    .deferUpdate()
                    .catch(() => {});

            }

            await modalSubmit.editReply({

                components: [

                    new ActionRowBuilder()
                        .addComponents(

                            ButtonBuilder
                                .from(
                                    confirmRow.components[0]
                                )
                                .setDisabled(
                                    true
                                )

                        )

                ],

            });

            // =================================================
            // READ FIREBASE RECORD
            // =================================================

            const verificationSnapshot =
                await ref.get();

            if (
                !verificationSnapshot.exists()
            ) {

                return modalSubmit.editReply({

                    content:
                        "Your verification session could not be found.",

                    embeds:
                        [],

                    components:
                        [],

                });

            }

            const verification =
                verificationSnapshot.val();

            // =================================================
            // VERIFY CODE STILL MATCHES
            // =================================================

            if (
                verification.verificationCode !==
                verificationCode
            ) {

                return modalSubmit.editReply({

                    content:
                        "Your verification session is no longer valid.",

                    embeds:
                        [],

                    components:
                        [],

                });

            }

            // =================================================
            // GET ROBLOX DESCRIPTION
            // =================================================

            let blurb;

            try {

                blurb =
                    await noblox.getBlurb(
                        userId
                    );

            } catch (error) {

                console.warn(
                    "Could not retrieve Roblox description:",
                    error
                );

                return modalSubmit.editReply({

                    content:
                        "Could not retrieve the Roblox profile description. Please try again.",

                    embeds:
                        [],

                    components:
                        [],

                });

            }

            // =================================================
            // CHECK DESCRIPTION
            // =================================================

            if (
                !blurb ||
                !blurb.includes(
                    verificationCode
                )
            ) {

                const failEmbed =
                    new EmbedBuilder()

                        .setTitle(
                            "Verification Failed"
                        )

                        .setDescription(
                            "Make sure the code is in your Roblox profile and try again."
                        )

                        .setColor(
                            "#9D4D4D"
                        )

                        .setFooter({

                            text:
                                interaction.client.user.username,

                            icon_url:
                                interaction.client.user.displayAvatarURL({

                                    format:
                                        "png",

                                    dynamic:
                                        true,

                                }),

                        })

                        .setTimestamp();

                return modalSubmit.editReply({

                    embeds:
                        [failEmbed],

                    components:
                        [],

                });

            }

            // =================================================
            // UPDATE ROLES
            // =================================================
            //
            // This now uses the exact same role-binding system
            // as /update.
            //
            // =================================================

            const roleUpdate =
                await updateRolesForVerifiedUser(
                    interaction,
                    admin,
                    noblox,
                    userId
                );

            // =================================================
            // UPDATE DISCORD NICKNAME
            // =================================================

            let nicknameUpdated =
                false;

            if (
                interaction.member.id !==
                guild.ownerId
            ) {

                try {

                    await interaction.member.setNickname(
                        username
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

            // =================================================
            // MARK FIREBASE VERIFIED
            // =================================================

            await ref.update({

                verified:
                    true,

                verificationMethod:
                    "description",

                robloxID:
                    String(userId),

                robloxUsername:
                    username,

                verificationCode:
                    null,

                statecode:
                    null,

                verifiedAt:
                    Date.now(),

            });

            // =================================================
            // LOG VERIFICATION
            // =================================================

            try {

                await logUpdateVerify(

                    interaction.client,

                    admin,

                    {

                        guildId:
                            guildId,

                        type:
                            "verify",

                        discordUser:
                            discordId,

                        robloxUsername:
                            username,

                        robloxId:
                            String(userId),

                        nicknameChanged:
                            nicknameUpdated,

                        rolesAdded:
                            roleUpdate.rolesAdded.map(
                                role =>
                                    role.id
                            ),

                        rolesRemoved:
                            roleUpdate.rolesRemoved.map(
                                role =>
                                    role.id
                            )

                    }

                );

            } catch (loggerError) {

                console.warn(
                    "Failed to log verification:",
                    loggerError
                );

            }

            // =================================================
            // SUCCESS EMBED
            // =================================================

            const successEmbed =
                new EmbedBuilder()

                    .setTitle(
                        "Verification Successful"
                    )

                    .setColor(
                        "DarkBlue"
                    )

                    .setDescription(
                        `Successfully linked Roblox user **${username}**.`
                    )

                    .setThumbnail(
                        avatarUrl
                    )

                    .setFooter({

                        text:
                            interaction.client.user.username,

                        icon_url:
                            interaction.client.user.displayAvatarURL({

                                format:
                                    "png",

                                dynamic:
                                    true,

                            }),

                    })

                    .setTimestamp();

            // =================================================
            // ROLE INFORMATION
            // =================================================

            let roleDescription =
                "";

            const addedNames =
                roleUpdate.rolesAdded.map(
                    role =>
                        role.name
                );

            const removedNames =
                roleUpdate.rolesRemoved.map(
                    role =>
                        role.name
                );

            if (
                addedNames.length > 0
            ) {

                roleDescription +=
                    `\n\n**Roles Added:** ${addedNames
                        .map(
                            name =>
                                `\`${name}\``
                        )
                        .join(", ")}`;

            }

            if (
                removedNames.length > 0
            ) {

                roleDescription +=
                    `\n\n**Roles Removed:** ${removedNames
                        .map(
                            name =>
                                `\`${name}\``
                        )
                        .join(", ")}`;

            }

            if (
                addedNames.length === 0 &&
                removedNames.length === 0
            ) {

                roleDescription =
                    "\n\nNo role changes were required.";

            }

            successEmbed.setDescription(
                `Successfully linked Roblox user **${username}**.` +
                roleDescription
            );

            // =================================================
            // SUCCESS RESPONSE
            // =================================================

            await modalSubmit.editReply({

                embeds:
                    [successEmbed],

                components:
                    [],

            });

        } catch (error) {

            console.warn(
                "Verification command error:",
                error
            );

            // =================================================
            // LOG ERROR
            // =================================================

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

                console.warn(
                    "Failed to log verification error:",
                    loggerError
                );

            }

            // =================================================
            // ERROR RESPONSE
            // =================================================

            if (
                !interaction.replied &&
                !interaction.deferred
            ) {

                await interaction
                    .reply({

                        content:
                            "An error occurred while starting verification.",

                        ephemeral:
                            true,

                    })
                    .catch(() => {});

            } else if (
                !modalSubmit
            ) {

                // Nothing else to edit here.

            }

        }

    },

};