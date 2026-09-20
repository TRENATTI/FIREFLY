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

const {
    verify_container
} = require("./embeds/verify.js");

const nobloxDefault = require("noblox.js");

const db = (...args) =>
    import("../../database-services/db.js").then(({ exec }) => exec(...args));

const groupRoleMap = require("../../verify-services/groupRoleMap");

const https = require("https");


// ============================================================
// ROBLOX AVATAR
// ============================================================

function fetchAvatar(userId) {
    return new Promise((resolve) => {

        const url =
            `https://thumbnails.roblox.com/v1/users/avatar-headshot?` +
            `userIds=${userId}&size=150x150&format=Png&isCircular=true`;

        https
            .get(url, (res) => {

                let data = "";

                res.on("data", (chunk) => {
                    data += chunk;
                });

                res.on("end", () => {

                    try {

                        const json = JSON.parse(data);

                        const imageUrl =
                            json.data?.[0]?.imageUrl || null;

                        resolve(imageUrl);

                    } catch {

                        resolve(null);

                    }

                });

            })
            .on("error", () => resolve(null));
    });
}


// ============================================================
// GROUP ROLE ASSIGNMENT
// ============================================================

async function assignRolesForUser(
    interaction,
    guildId,
    robloxId,
    robloxUsername
) {

    const guildGroupMap = groupRoleMap[guildId];

    if (!guildGroupMap) {
        return robloxUsername;
    }

    let chosenPrefix = "";

    for (const [groupId, rankToRoles] of Object.entries(guildGroupMap)) {

        try {

            const rank =
                await nobloxDefault.getRankInGroup(
                    Number(groupId),
                    robloxId
                );

            const roleEntries =
                rankToRoles[rank];

            if (Array.isArray(roleEntries)) {

                for (const entry of roleEntries) {

                    const role =
                        interaction.guild.roles.cache.get(entry.id);

                    if (
                        role &&
                        !interaction.member.roles.cache.has(role.id)
                    ) {

                        await interaction.member
                            .roles
                            .add(role)
                            .catch(() => {});

                    }

                    if (
                        entry.prefix &&
                        !chosenPrefix
                    ) {

                        chosenPrefix = entry.prefix;

                    }

                }

            }

        } catch {}

    }

    return chosenPrefix + robloxUsername;
}


// ============================================================
// COMMAND
// ============================================================

module.exports = {

    data: new SlashCommandBuilder()
        .setName("verify")
        .setDescription(
            "Verify your account with our services."
        ),

    subdata: {
        cooldown: 3
    },


    async execute(interaction, noblox, admin) {

        const firebase = admin.database();

        const discordId =
            interaction.user.id;

        const guildId =
            interaction.guild.id;


        try {

            // ====================================================
            // ALREADY LINKED CHECK
            // ====================================================

            const linkedrows = await db(
                `
                SELECT *
                FROM linked_accounts
                WHERE discord_id = ?
                `,
                [discordId]
            );

            const existing =
                linkedrows[0] || null;

            if (existing) {

                return interaction.reply({

                    content:
                        `You’ve already linked your Discord account to **${existing.roblox_username}**.`,

                    ephemeral: true

                });

            }


            // ====================================================
            // GENERATE WEBSITE STATE
            // ====================================================

            const state =
                crypto
                    .randomBytes(32)
                    .toString("hex");


            // ====================================================
            // FIREBASE VERIFICATION RECORD
            // ====================================================

            const ref = firebase
                .ref("system")
                .child("user_verification")
                .child(`discord_${discordId}`);


            await ref.update({

                verificationGuildID:
                    guildId,

                verified:
                    false,

                statecode:
                    state,

                discordID:
                    discordId

            });


            // ====================================================
            // INITIAL VERIFICATION MESSAGE
            // ====================================================

            await interaction.reply({

                components: [

                    new ContainerBuilder()

                        .setAccentColor(0x0099ff)


                        // ========================================
                        // HEADER
                        // ========================================

                        .addTextDisplayComponents(
                            textDisplay =>
                                textDisplay.setContent(
                                    "# Verify"
                                )
                        )


                        .addSeparatorComponents(
                            separator =>
                                separator
                        )


                        // ========================================
                        // WEBSITE VERIFICATION
                        // ========================================

                        .addSectionComponents(
                            section =>
                                section

                                    .addTextDisplayComponents(
                                        textDisplay =>
                                            textDisplay.setContent(
                                                "## Roblox Account Verifier\n" +
                                                "Verify your Roblox account using our website."
                                            )
                                    )

                                    .setButtonAccessory(
                                        button =>
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
                            separator =>
                                separator
                        )


                        // ========================================
                        // USER DESCRIPTION VERIFICATION
                        // ========================================

                        .addSectionComponents(
                            section =>
                                section

                                    .addTextDisplayComponents(
                                        textDisplay =>
                                            textDisplay.setContent(
                                                "## User Description\n" +
                                                "Verify by placing a verification code in your Roblox About Me."
                                            )
                                    )

                                    .setButtonAccessory(
                                        button =>
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
                        )

                ],

                ephemeral: true,

                flags:
                    MessageFlags.IsComponentsV2,

                withResponse:
                    false

            });


            // ====================================================
            // WAIT FOR DESCRIPTION BUTTON
            // ====================================================

            const message =
                await interaction.fetchReply();


            const confirmation =
                await message
                    .awaitMessageComponent({

                        componentType:
                            ComponentType.Button,

                        time:
                            120000,

                        filter:
                            (i) =>
                                i.user.id === discordId &&
                                i.customId ===
                                    "verify_description"

                    })
                    .catch(() => null);


            // ====================================================
            // NO BUTTON PRESSED
            // ====================================================

            if (!confirmation) {

                return;

            }


            // ====================================================
            // SHOW ROBLOX USERNAME MODAL
            // ====================================================

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


            await confirmation.showModal(
                modal
            );


            // ====================================================
            // WAIT FOR MODAL SUBMISSION
            // ====================================================

            const modalSubmit =
                await confirmation
                    .awaitModalSubmit({

                        time:
                            120000,

                        filter:
                            (i) =>
                                i.user.id === discordId &&
                                i.customId ===
                                    "verify_description_modal"

                    })
                    .catch(() => null);


            if (!modalSubmit) {

                return;

            }


            await modalSubmit.deferReply({
                ephemeral: true
            });


            // ====================================================
            // GET USERNAME
            // ====================================================

            const username =
                modalSubmit.fields
                    .getTextInputValue(
                        "roblox_username"
                    )
                    .trim();


            // ====================================================
            // FIND ROBLOX USER
            // ====================================================

            let userId;

            try {

                userId =
                    await noblox.getIdFromUsername(
                        username
                    );

            } catch {

                return modalSubmit.editReply({

                    content:
                        `Could not find Roblox user **"${username}"**.`

                });

            }


            // ====================================================
            // GENERATE DESCRIPTION CODE
            // ====================================================

            const code =
                `VER-${crypto
                    .randomBytes(2)
                    .toString("hex")
                    .toUpperCase()}`;


            // ====================================================
            // STORE DESCRIPTION VERIFICATION
            // ====================================================

            await db(
                `
                INSERT INTO verifications
                    (
                        discord_id,
                        roblox_id,
                        roblox_username,
                        code
                    )
                VALUES
                    (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    roblox_id = VALUES(roblox_id),
                    roblox_username = VALUES(roblox_username),
                    code = VALUES(code)
                `,
                [
                    discordId,
                    userId,
                    username,
                    code
                ]
            );


            // ====================================================
            // ALSO STORE CURRENT METHOD IN FIREBASE
            // ====================================================

            await ref.update({

                verificationMethod:
                    "description",

                robloxID:
                    String(userId),

                robloxUsername:
                    username,

                verificationCode:
                    code

            });


            // ====================================================
            // AVATAR
            // ====================================================

            const avatarUrl =
                await fetchAvatar(
                    userId
                );


            // ====================================================
            // DESCRIPTION VERIFICATION EMBED
            // ====================================================

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

                        `\`\`\`${code}\`\`\`\n` +

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
                                    true

                            })

                    })

                    .setTimestamp();


            // ====================================================
            // CONFIRM BUTTON
            // ====================================================

            const row =
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

                embeds: [
                    verifyEmbed
                ],

                components: [
                    row
                ]

            });


            // ====================================================
            // WAIT FOR CONFIRM
            // ====================================================

            const descriptionMessage =
                await modalSubmit.fetchReply();


            const confirmationButton =
                await descriptionMessage
                    .awaitMessageComponent({

                        componentType:
                            ComponentType.Button,

                        time:
                            60000,

                        filter:
                            (i) =>
                                i.user.id ===
                                    discordId &&

                                i.customId ===
                                    "verify_confirm"

                    })
                    .catch(() => null);


            // ====================================================
            // TIMED OUT
            // ====================================================

            if (!confirmationButton) {

                await db(
                    `DELETE FROM verifications WHERE discord_id = ?`,
                    [discordId]
                );


                await ref.update({

                    verificationMethod:
                        null,

                    robloxID:
                        null,

                    robloxUsername:
                        null,

                    verificationCode:
                        null

                }).catch(() => {});


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
                                        true

                                })

                        })

                        .setTimestamp();


                return modalSubmit.editReply({

                    embeds: [
                        timeoutEmbed
                    ],

                    components: []

                });

            }


            // ====================================================
            // DISABLE CONFIRM BUTTON
            // ====================================================

            if (
                !confirmationButton.deferred &&
                !confirmationButton.replied
            ) {

                await confirmationButton
                    .deferUpdate()
                    .catch(() => {});

            }


            await modalSubmit.editReply({

                components: [

                    new ActionRowBuilder()
                        .addComponents(

                            ButtonBuilder
                                .from(
                                    row.components[0]
                                )
                                .setDisabled(
                                    true
                                )

                        )

                ]

            });


            // ====================================================
            // CHECK ROBLOX DESCRIPTION
            // ====================================================

            try {

                const blurb =
                    await noblox.getBlurb(
                        userId
                    );


                const pendingrows =
                    await db(
                        `
                        SELECT *
                        FROM verifications
                        WHERE discord_id = ?
                        `,
                        [discordId]
                    );


                const pending =
                    pendingrows[0] || null;


                if (
                    !pending ||
                    !blurb.includes(
                        pending.code
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
                                            true

                                    })

                            })

                            .setTimestamp();


                    return modalSubmit.editReply({

                        embeds: [
                            failEmbed
                        ],

                        components: []

                    });

                }


                // =================================================
                // DELETE PENDING VERIFICATION
                // =================================================

                const result =
                    await db(
                        `
                        DELETE FROM verifications
                        WHERE discord_id = ?
                        `,
                        [discordId]
                    );


                console.log(
                    `${result.affectedRows} row(s) deleted.`
                );


                // =================================================
                // LINK ACCOUNT
                // =================================================

                await db(
                    `
                    INSERT INTO linked_accounts
                        (
                            discord_id,
                            roblox_id,
                            roblox_username
                        )
                    VALUES
                        (?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                        roblox_id = VALUES(roblox_id),
                        roblox_username = VALUES(roblox_username)
                    `,
                    [
                        discordId,
                        userId,
                        username
                    ]
                );


                // =================================================
                // ASSIGN GROUP ROLES
                // =================================================

                const finalNickname =
                    await assignRolesForUser(
                        interaction,
                        guildId,
                        userId,
                        username
                    );


                await interaction.member
                    .setNickname(
                        finalNickname
                    )
                    .catch(() => {});


                // =================================================
                // LOG
                // =================================================

                const logChannelIds = [

                    "1517324782964707530",
                    "1517329798643581038",
                    "1517329877978714254",
                    "1517329973629947984",
                    "1517330338630602822",
                    "1383901410906734713"

                ];


                const logEmbed =
                    new EmbedBuilder()

                        .setTitle(
                            "A user linked their Roblox account with Firefly"
                        )

                        .setColor(
                            "DarkBlue"
                        )

                        .addFields(

                            {
                                name:
                                    "Discord User",

                                value:
                                    `${interaction.user.tag} (ID: ||${interaction.user.id}||)`,

                                inline:
                                    true
                            },

                            {
                                name:
                                    "Roblox User",

                                value:
                                    `${username} (ID: [${userId}](https://www.roblox.com/users/${userId}/profile))`,

                                inline:
                                    true
                            }

                        )

                        .setFooter({

                            text:
                                interaction.client.user.username,

                            icon_url:
                                interaction.client.user.displayAvatarURL({

                                    format:
                                        "png",

                                    dynamic:
                                        true

                                })

                        })

                        .setTimestamp();


                for (
                    const channelId
                    of logChannelIds
                ) {

                    const logChannel =
                        interaction.client
                            .channels
                            .cache
                            .get(channelId);


                    if (!logChannel) {
                        continue;
                    }


                    await logChannel
                        .send({
                            embeds: [
                                logEmbed
                            ]
                        })
                        .catch((err) => {

                            console.warn(
                                `Failed to send log to channel ${channelId}:`,
                                err
                            );

                        });

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
                        null

                });


                // =================================================
                // SUCCESS
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
                                        true

                                })

                        })

                        .setTimestamp();


                await modalSubmit.editReply({

                    embeds: [
                        successEmbed
                    ],

                    components: []

                });


            } catch (err) {

                await modalSubmit.editReply({

                    content:
                        `Could not complete verification.\n**Error:** ${err.message}`,

                    embeds: [],

                    components: []

                });

            }


        } catch (error) {

            console.warn(
                "Verification command error:",
                error
            );


            if (!interaction.replied && !interaction.deferred) {

                await interaction.reply({

                    content:
                        "An error occurred while starting verification.",

                    ephemeral:
                        true

                }).catch(() => {});

            }

        }

    }

};