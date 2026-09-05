const { EmbedBuilder } = require("discord.js");
require("dotenv").config();

/**
 * Global Discord Ban Service
 *
 * Reads:
 *   blacklist/users/*
 *
 * Expected user structure:
 * {
 *   associatedAccounts: {
 *     discordAccounts: "123456789,987654321",
 *     robloxAccounts: "..."
 *   },
 *   latestUsername: "...",
 *   permanent: true
 * }
 *
 * Every 24 hours, every Discord account in the database
 * is checked against every guild the bot is in.
 */

const RUN_INTERVAL = 24 * 60 * 60 * 1000;
const { SlashCommandBuilder } = require("discord.js");

require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("globalblacklist")
		.setDescription("Run globla blacklist procedures."),
	subdata: {
		cooldown: 3,
	},
	async execute(interaction, noblox, admin) {
        // Keep the same developer-mode behavior as your existing module.
        /*if (process.env.DEVELOPER_MODE === "true") {
            console.log("| globalban-command | Developer mode enabled.");
            return;
        }*/

        if (
                interaction.user.id == "170639211182030850" ||
                interaction.user.id == "463516784578789376" ||
                interaction.user.id == "206090047462703104" ||
                interaction.user.id == "1154775391597240391" ||
                interaction.user.id == "175922772923383808"
            ) {
                interaction.reply({
                    content: `Global Blacklist Running!`,
                });
                isAuthorized();
        } else {
            return interaction
                .reply({
                    content: `Sorry ${message.author}, but only the Adjudicators can run that command!`,
                })
                .then((message) =>
                    setTimeout(() => message.delete(), 10_000)
                );
        }

        async function isAuthorized() {
            const db = admin.database();

            /**
             * Get all Discord IDs from the Firebase structure.
             */
            async function getBannedDiscordUsers() {
                const snapshot = await db
                    .ref("blacklist")
                    .child("users")
                    .once("value");

                const users = snapshot.val() || {};
                const bannedUsers = new Map();

                for (const [userKey, userData] of Object.entries(users)) {
                    if (!userData || !userData.associatedAccounts) {
                        continue;
                    }

                    if (userData.permanent !== true) {
                        continue;
                    }

                    const discordAccounts =
                        userData.associatedAccounts.discordAccounts;

                    if (!discordAccounts || typeof discordAccounts !== "string") {
                        continue;
                    }

                    const discordIds = discordAccounts
                        .split(",")
                        .map((id) => id.trim())
                        .filter(Boolean);

                    for (const discordId of discordIds) {
                        // Discord snowflakes are numeric strings.
                        if (!/^\d{17,20}$/.test(discordId)) {
                            continue;
                        }
                        
                        bannedUsers.set(discordId, {
                            firebaseKey: userKey,
                            username: userData.latestUsername || "Unknown User",
                            permanent: userData.permanent === true,
                        });
                    }
                }

                return bannedUsers;
            }

            /**
             * Ban all users found in Firebase.
             */
            async function processBans() {
                console.log(
                    new Date(),
                    "| globalban-command | Starting ban synchronization..."
                );

                let bannedUsers;

                try {
                    bannedUsers = await getBannedDiscordUsers();
                } catch (error) {
                    console.error(
                        new Date(),
                        "| globalban-command | Failed to read Firebase:",
                        error
                    );
                    return;
                }

                console.log(
                    new Date(),
                    `| globalban-command | Found ${bannedUsers.size} Discord accounts.`
                );

                if (bannedUsers.size === 0) {
                    console.log(
                        new Date(),
                        "| globalban-command | No Discord accounts to ban."
                    );
                    return;
                }

                for (const [discordId, userInfo] of bannedUsers) {
                    for (const guild of interaction.client.guilds.cache.values()) {
                        try {
                            if (!guild.members.me?.permissions.has("BanMembers")) {
                                console.warn(
                                    new Date(),
                                    `| globalban-command | Missing Ban Members permission in ${guild.name}.`
                                );
                                continue;
                            }
                            /// Check whether the user is already banned.
                            // This works even if the user is NOT currently in the server.
                            async function isUserBanned(guild, discordId) {
                                try {
                                    await guild.bans.fetch(discordId);
                                    return true;
                                } catch (error) {
                                    // Discord error 10026 = Unknown Ban
                                    if (error.code === 10026) {
                                        return false;
                                    }

                                    throw error;
                                }
                            }
                            const alreadyBanned = await isUserBanned(guild, discordId);

                            if (alreadyBanned) {
                                console.log(
                                    new Date(),
                                    `| globalban-command | ${discordId} is already banned in ${guild.name}.`
                                );
                                continue;
                            }


                            // Prevent attempting to ban the bot itself.
                            if (discordId === interaction.client.user.id) {
                                console.warn(
                                    new Date(),
                                    `| globalban-command | Skipping bot account ${discordId}.`
                                );
                                continue;
                            }

                            // Prevent attempting to ban the server owner.
                            if (guild.ownerId === discordId) {
                                console.warn(
                                    new Date(),
                                    `| globalban-command | Skipping server owner ${discordId} in ${guild.name}.`
                                );
                                continue;
                            }

                            // User is not banned, so ban the Discord ID directly.
                            // This works even if they are not currently a member.
                            await guild.members.ban(discordId, {
                                reason: `Global ban service | ${userInfo.username} | ${userInfo.firebaseKey}`,
                                deleteMessageSeconds: 0,
                            });

                            console.log(
                                new Date(),
                                `| globalban-command | Banned ${discordId} (${userInfo.username}) from ${guild.name}`
                            );
                        } catch (error) {
                            console.error(
                                new Date(),
                                `| globalban-command | Failed to ban ${discordId} from ${guild.name}:`,
                                error
                            );
                        }
                    }
                }

                console.log(
                    new Date(),
                    "| globalban-command | Ban synchronization complete."
                );
            }

        
            console.log(
                new Date(),
                "| global-ban-command | Service started."
            );

            // Run immediately on startup.
            await processBans()
        }
    }
}